import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')

    if (!data) {
      return NextResponse.json({ error: 'Missing QR code data' }, { status: 400 })
    }

    let qrData
    try {
      qrData = JSON.parse(decodeURIComponent(data))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid QR code data format' }, { status: 400 })
    }

    const { bookingId, business: businessSlug, type } = qrData

    if (type !== 'booking' || !bookingId || !businessSlug) {
      return NextResponse.json({ error: 'Invalid QR code data' }, { status: 400 })
    }

    // Fetch booking details with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: true,
        session: {
          include: {
            event: {
              include: {
                experience: {
                  include: {
                    business: true
                  }
                }
              }
            }
          }
        },
        items: {
          include: {
            addOn: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify the booking belongs to the correct business
    if (booking.session.event.experience.business.slug !== businessSlug) {
      return NextResponse.json({ error: 'Invalid business for this booking' }, { status: 403 })
    }

    // Return booking details for check-in interface
    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        checkedIn: booking.checkedIn,
        checkInTime: booking.checkInTime,
        quantity: booking.quantity,
        total: booking.total,
        createdAt: booking.createdAt
      },
      guest: {
        id: booking.guest.id,
        firstName: booking.guest.firstName,
        lastName: booking.guest.lastName,
        email: booking.guest.email,
        phone: booking.guest.phone
      },
      session: {
        id: booking.session.id,
        startTime: booking.session.startTime,
        endTime: booking.session.endTime,
        currentCount: booking.session.currentCount,
        maxCapacity: booking.session.maxCapacity
      },
      event: {
        id: booking.session.event.id,
        name: booking.session.event.name,
        description: booking.session.event.description
      },
      experience: {
        id: booking.session.event.experience.id,
        name: booking.session.event.experience.name
      },
      business: {
        id: booking.session.event.experience.business.id,
        name: booking.session.event.experience.business.name,
        slug: booking.session.event.experience.business.slug
      },
      items: booking.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        itemType: item.itemType,
        addOn: item.addOn ? {
          id: item.addOn.id,
          name: item.addOn.name,
          description: item.addOn.description
        } : null
      }))
    })

  } catch (error) {
    console.error('Error processing check-in request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
    }

    // Update booking to checked in
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkedIn: true,
        checkInTime: new Date()
      },
      include: {
        guest: true,
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

    return NextResponse.json({
      success: true,
      message: `${updatedBooking.guest.firstName} ${updatedBooking.guest.lastName} has been checked in`,
      booking: {
        id: updatedBooking.id,
        checkedIn: updatedBooking.checkedIn,
        checkInTime: updatedBooking.checkInTime
      }
    })

  } catch (error) {
    console.error('Error checking in booking:', error)
    return NextResponse.json({ error: 'Failed to check in booking' }, { status: 500 })
  }
}