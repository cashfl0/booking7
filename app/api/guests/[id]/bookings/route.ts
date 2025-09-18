import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch all bookings for this guest that belong to the current business
    const bookings = await prisma.booking.findMany({
      where: {
        guestId: id,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform decimal fields to numbers
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      total: Number(booking.total),
      createdAt: booking.createdAt.toISOString(),
      session: {
        ...booking.session,
        startTime: booking.session.startTime.toISOString(),
        endTime: booking.session.endTime.toISOString()
      },
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
    console.error('Error fetching guest bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest bookings' },
      { status: 500 }
    )
  }
}