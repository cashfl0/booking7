import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingFilterSchema = z.object({
  experienceId: z.string().optional(),
  eventId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional()
})

const createBookingSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  guestId: z.string().min(1, 'Guest is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  addOnIds: z.array(z.string()).optional()
})

// GET bookings for the business with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = bookingFilterSchema.parse({
      experienceId: searchParams.get('experienceId') || undefined,
      eventId: searchParams.get('eventId') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    })

    // Build where clause for business-scoped bookings
    const whereClause = {
      session: {
        event: {
          experience: {
            businessId: session.user.businessId
          },
          ...(filters.experienceId && { experienceId: filters.experienceId })
        },
        ...(filters.eventId && { eventId: filters.eventId })
      },
      ...(filters.status && { status: filters.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' })
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        guest: true,
        session: {
          include: {
            event: {
              include: {
                experience: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        },
        items: {
          include: {
            addOn: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: filters.limit || 50,
      skip: filters.offset || 0
    })

    // Transform decimal fields to numbers for JSON serialization
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      total: Number(booking.total),
      items: booking.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        addOn: item.addOn ? {
          ...item.addOn,
          price: Number(item.addOn.price)
        } : null
      }))
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Verify session belongs to business
    const sessionData = await prisma.session.findUnique({
      where: { id: validatedData.sessionId },
      include: {
        event: {
          include: {
            experience: true,
            addOns: {
              include: {
                addOn: true
              }
            }
          }
        }
      }
    })

    if (!sessionData || sessionData.event.experience.businessId !== session.user.businessId) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
    }

    // Verify guest exists
    const guest = await prisma.guest.findUnique({
      where: { id: validatedData.guestId }
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Check session capacity
    const currentBookingsCount = await prisma.booking.aggregate({
      where: {
        sessionId: validatedData.sessionId,
        status: { not: 'CANCELLED' }
      },
      _sum: {
        quantity: true
      }
    })

    const currentCount = currentBookingsCount._sum.quantity || 0
    const maxCapacity = sessionData.maxCapacity || sessionData.event.maxCapacity || sessionData.event.experience.maxCapacity

    if (currentCount + validatedData.quantity > maxCapacity) {
      return NextResponse.json({
        error: 'Insufficient capacity',
        details: `Only ${maxCapacity - currentCount} spots available`
      }, { status: 400 })
    }

    // Calculate total cost
    const basePrice = sessionData.event.basePrice
    let sessionTotal = Number(basePrice) * validatedData.quantity

    // Validate and calculate add-on costs
    const addOnItems: Array<{
      addOnId: string
      quantity: number
      unitPrice: number
      totalPrice: number
      itemType: 'ADD_ON'
    }> = []
    if (validatedData.addOnIds && validatedData.addOnIds.length > 0) {
      const availableAddOns = sessionData.event.addOns.map(ea => ea.addOn)

      for (const addOnId of validatedData.addOnIds) {
        const addOn = availableAddOns.find(a => a.id === addOnId)
        if (!addOn) {
          return NextResponse.json({
            error: 'Invalid add-on',
            details: `Add-on ${addOnId} is not available for this event`
          }, { status: 400 })
        }

        addOnItems.push({
          addOnId: addOn.id,
          quantity: validatedData.quantity,
          unitPrice: Number(addOn.price),
          totalPrice: Number(addOn.price) * validatedData.quantity,
          itemType: 'ADD_ON' as const
        })

        sessionTotal += Number(addOn.price) * validatedData.quantity
      }
    }

    // Create booking with items in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          sessionId: validatedData.sessionId,
          guestId: validatedData.guestId,
          quantity: validatedData.quantity,
          total: sessionTotal,
          status: 'CONFIRMED'
        }
      })

      // Create session booking item
      await tx.bookingItem.create({
        data: {
          bookingId: newBooking.id,
          quantity: validatedData.quantity,
          unitPrice: basePrice,
          totalPrice: Number(basePrice) * validatedData.quantity,
          itemType: 'SESSION'
        }
      })

      // Create add-on booking items
      for (const addOnItem of addOnItems) {
        await tx.bookingItem.create({
          data: {
            bookingId: newBooking.id,
            ...addOnItem
          }
        })
      }

      // Update session current count
      await tx.session.update({
        where: { id: validatedData.sessionId },
        data: {
          currentCount: {
            increment: validatedData.quantity
          }
        }
      })

      return newBooking
    })

    // Fetch the complete booking data to return
    const completeBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        guest: true,
        session: {
          include: {
            event: {
              include: {
                experience: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        },
        items: {
          include: {
            addOn: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!completeBooking) {
      throw new Error('Failed to retrieve created booking')
    }

    // Transform decimal fields
    const transformedBooking = {
      ...completeBooking,
      total: Number(completeBooking.total),
      items: completeBooking.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        addOn: item.addOn ? {
          ...item.addOn,
          price: Number(item.addOn.price)
        } : null
      }))
    }

    return NextResponse.json(transformedBooking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}