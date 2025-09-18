import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE remove add-on association from event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, addonId: string }> }
) {
  try {
    const { id: eventId, addonId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the event belongs to the user's business
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        experience: {
          businessId: session.user.businessId
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify the add-on belongs to the user's business
    const addOn = await prisma.addOn.findFirst({
      where: {
        id: addonId,
        businessId: session.user.businessId
      }
    })

    if (!addOn) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Find the association
    const eventAddOn = await prisma.eventAddOn.findFirst({
      where: {
        eventId: eventId,
        addOnId: addonId
      }
    })

    if (!eventAddOn) {
      return NextResponse.json({
        error: 'Add-on is not associated with this event'
      }, { status: 404 })
    }

    // Check if there are any bookings that include this add-on for this event
    const bookingsWithAddon = await prisma.bookingItem.count({
      where: {
        addOnId: addonId,
        booking: {
          session: {
            eventId: eventId
          }
        }
      }
    })

    if (bookingsWithAddon > 0) {
      return NextResponse.json({
        error: 'Cannot remove add-on',
        message: 'This add-on has existing bookings for this event and cannot be removed'
      }, { status: 400 })
    }

    // Remove the association
    await prisma.eventAddOn.delete({
      where: {
        id: eventAddOn.id
      }
    })

    return NextResponse.json({ message: 'Add-on removed from event successfully' })
  } catch (error) {
    console.error('Error removing add-on from event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}