import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addOnAssociationSchema = z.object({
  addOnId: z.string().min(1, 'Add-on ID is required')
})

// GET add-ons associated with an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
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

    // Get all add-ons associated with this event
    const eventAddons = await prisma.eventAddOn.findMany({
      where: {
        eventId: eventId
      },
      include: {
        addOn: {
          include: {
            _count: {
              select: {
                bookingItems: true
              }
            }
          }
        }
      },
      orderBy: {
        addOn: {
          sortOrder: 'asc'
        }
      }
    })

    return NextResponse.json(eventAddons.map(eventAddon => ({
      ...eventAddon.addOn,
      price: Number(eventAddon.addOn.price)
    })))
  } catch (error) {
    console.error('Error fetching event add-ons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST associate an add-on with an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { addOnId } = addOnAssociationSchema.parse(body)

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
        id: addOnId,
        businessId: session.user.businessId
      }
    })

    if (!addOn) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Check if the association already exists
    const existingAssociation = await prisma.eventAddOn.findFirst({
      where: {
        eventId: eventId,
        addOnId: addOnId
      }
    })

    if (existingAssociation) {
      return NextResponse.json({
        error: 'Add-on is already associated with this event'
      }, { status: 400 })
    }

    // Create the association
    const eventAddOn = await prisma.eventAddOn.create({
      data: {
        eventId: eventId,
        addOnId: addOnId
      },
      include: {
        addOn: {
          include: {
            _count: {
              select: {
                bookingItems: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      ...eventAddOn.addOn,
      price: Number(eventAddOn.addOn.price)
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error associating add-on with event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}