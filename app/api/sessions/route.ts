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

// GET sessions (filtered by eventId if provided)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    const whereClause: {
      event: { experience: { businessId: string } }
      eventId?: string
    } = {
      event: {
        experience: {
          businessId: session.user.businessId
        }
      }
    }

    if (eventId) {
      whereClause.eventId = eventId
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
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
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const newSession = await prisma.session.create({
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

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }

    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}