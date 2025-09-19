import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  quantity: z.number().int().positive().optional()
})

// GET individual booking
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        session: {
          event: {
            experience: {
              businessId: session.user.businessId
            }
          }
        }
      },
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Transform decimal fields to numbers
    const transformedBooking = {
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
    }

    return NextResponse.json(transformedBooking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH update booking
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // Verify booking belongs to business
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        session: {
          event: {
            experience: {
              businessId: session.user.businessId
            }
          }
        }
      },
      include: {
        session: {
          include: {
            event: {
              include: {
                experience: true
              }
            }
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // If quantity is being changed, validate capacity
    if (validatedData.quantity && validatedData.quantity !== existingBooking.quantity) {
      const quantityDiff = validatedData.quantity - existingBooking.quantity

      if (quantityDiff > 0) {
        // Check if there's enough capacity for the increase
        const currentBookingsCount = await prisma.booking.aggregate({
          where: {
            sessionId: existingBooking.sessionId,
            status: { not: 'CANCELLED' },
            id: { not: id } // Exclude current booking from count
          },
          _sum: {
            quantity: true
          }
        })

        const currentCount = (currentBookingsCount._sum.quantity || 0) + validatedData.quantity
        const maxCapacity = existingBooking.session.maxCapacity ||
                           existingBooking.session.event.maxCapacity ||
                           existingBooking.session.event.experience.maxCapacity

        if (currentCount > maxCapacity) {
          return NextResponse.json({
            error: 'Insufficient capacity',
            details: `Only ${maxCapacity - (currentBookingsCount._sum.quantity || 0)} additional spots available`
          }, { status: 400 })
        }
      }

      // Update session current count
      await prisma.session.update({
        where: { id: existingBooking.sessionId },
        data: {
          currentCount: {
            increment: quantityDiff
          }
        }
      })

      // If quantity changed, we need to recalculate totals
      if (validatedData.quantity) {
        const basePrice = existingBooking.session.event.basePrice
        const sessionItems = await prisma.bookingItem.findMany({
          where: {
            bookingId: id,
            itemType: 'SESSION'
          }
        })

        const addOnItems = await prisma.bookingItem.findMany({
          where: {
            bookingId: id,
            itemType: 'ADD_ON'
          }
        })

        // Extract quantity for safe use
        const newQuantity = validatedData.quantity!

        // Update session items
        for (const item of sessionItems) {
          await prisma.bookingItem.update({
            where: { id: item.id },
            data: {
              quantity: newQuantity,
              totalPrice: Number(basePrice) * newQuantity
            }
          })
        }

        // Update add-on items
        for (const item of addOnItems) {
          await prisma.bookingItem.update({
            where: { id: item.id },
            data: {
              quantity: newQuantity,
              totalPrice: Number(item.unitPrice) * newQuantity
            }
          })
        }

        // Recalculate total
        const newSessionTotal = Number(basePrice) * newQuantity
        const newAddOnTotal = addOnItems.reduce((total, item) => {
          return total + (Number(item.unitPrice) * newQuantity)
        }, 0)
        // We'll update the total in the main update
        const newTotal = newSessionTotal + newAddOnTotal

        // Update the booking with new total
        const updatedBooking = await prisma.booking.update({
          where: { id },
          data: {
            ...validatedData,
            total: newTotal
          },
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

        // Transform decimal fields
        const transformedBooking = {
          ...updatedBooking,
          total: Number(updatedBooking.total),
          createdAt: updatedBooking.createdAt.toISOString(),
          session: {
            ...updatedBooking.session,
            startTime: updatedBooking.session.startTime.toISOString(),
            endTime: updatedBooking.session.endTime.toISOString()
          },
          items: updatedBooking.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            addOn: item.addOn ? {
              ...item.addOn,
              price: Number(item.addOn.price)
            } : null
          }))
        }

        return NextResponse.json(transformedBooking)
      }
    }

    // Simple status update (no quantity change)
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: validatedData,
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

    // Transform decimal fields
    const transformedBooking = {
      ...updatedBooking,
      total: Number(updatedBooking.total),
      createdAt: updatedBooking.createdAt.toISOString(),
      session: {
        ...updatedBooking.session,
        startTime: updatedBooking.session.startTime.toISOString(),
        endTime: updatedBooking.session.endTime.toISOString()
      },
      items: updatedBooking.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        addOn: item.addOn ? {
          ...item.addOn,
          price: Number(item.addOn.price)
        } : null
      }))
    }

    return NextResponse.json(transformedBooking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}