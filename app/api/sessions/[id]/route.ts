import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sessionSchema = z.object({
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start time'),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end time'),
  eventId: z.string().min(1, 'Event is required')
})

// GET single session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionRecord = await prisma.session.findFirst({
      where: {
        id: params.id,
        event: {
          experience: {
            businessId: session.user.businessId
          }
        }
      },
      include: {
        bookings: {
          include: {
            guest: true,
            items: true
          }
        },
        event: {
          include: {
            experience: {
              select: {
                id: true,
                name: true,
                maxCapacity: true
              }
            }
          }
        }
      }
    })

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(sessionRecord)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session belongs to user's business
    const existingSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        event: {
          experience: {
            businessId: session.user.businessId
          }
        }
      },
      include: {
        bookings: true
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if there are any bookings - prevent changes to sessions with bookings
    if (existingSession.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot modify session with existing bookings' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = sessionSchema.parse(body)

    // Verify the event belongs to the user's business
    const event = await prisma.event.findFirst({
      where: {
        id: validatedData.eventId,
        experience: {
          businessId: session.user.businessId
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Validate time logic
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const updatedSession = await prisma.session.update({
      where: { id: params.id },
      data: {
        startTime: startTime,
        endTime: endTime,
        eventId: validatedData.eventId
      },
      include: {
        bookings: true,
        event: {
          include: {
            experience: {
              select: {
                id: true,
                name: true,
                maxCapacity: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    console.error('Error updating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session belongs to user's business and check for bookings
    const sessionRecord = await prisma.session.findFirst({
      where: {
        id: params.id,
        event: {
          experience: {
            businessId: session.user.businessId
          }
        }
      },
      include: {
        bookings: true
      }
    })

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // BOOKING PROTECTION: Check if there are any bookings
    if (sessionRecord.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete session with existing bookings. Cancel all bookings first.' },
        { status: 400 }
      )
    }

    await prisma.session.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}