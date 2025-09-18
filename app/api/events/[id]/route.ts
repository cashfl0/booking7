import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  experienceId: z.string().min(1, 'Experience is required'),
  isActive: z.boolean().default(true),
  sessionTimes: z.array(z.object({
    id: z.string(),
    time: z.string()
  })).optional(),
  selectedDays: z.array(z.string()).optional()
})

// GET single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
        experience: {
          businessId: session.user.businessId
        }
      },
      include: {
        sessions: true,
        experience: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify event belongs to user's business
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: params.id,
        experience: {
          businessId: session.user.businessId
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = eventSchema.parse(body)

    // Verify the experience belongs to the user's business
    const experience = await prisma.experience.findFirst({
      where: {
        id: validatedData.experienceId,
        businessId: session.user.businessId
      }
    })

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    // Validate date logic
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        startDate: startDate,
        endDate: endDate,
        experienceId: validatedData.experienceId,
        isActive: validatedData.isActive
      },
      include: {
        sessions: true,
        experience: {
          select: {
            id: true,
            name: true,
            slug: true,
            duration: true
          }
        }
      }
    })

    // Handle session updates if provided
    if (validatedData.sessionTimes && validatedData.selectedDays) {
      // Get existing sessions without bookings (can be modified/deleted)
      const existingSessions = await prisma.session.findMany({
        where: {
          eventId: params.id,
          bookings: {
            none: {}
          }
        }
      })

      // Delete existing sessions without bookings
      if (existingSessions.length > 0) {
        await prisma.session.deleteMany({
          where: {
            id: {
              in: existingSessions.map(s => s.id)
            }
          }
        })
      }

      // Create new sessions
      const sessions = []
      const dayMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      }

      // Iterate through each day in the date range
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dayName = Object.keys(dayMap).find(key => dayMap[key] === currentDate.getDay())

        // If this day is selected, create sessions for all times
        if (dayName && validatedData.selectedDays.includes(dayName)) {
          for (const sessionTime of validatedData.sessionTimes) {
            const [hours, minutes] = sessionTime.time.split(':').map(Number)

            const sessionStart = new Date(currentDate)
            sessionStart.setHours(hours, minutes, 0, 0)

            const sessionEnd = new Date(sessionStart)
            sessionEnd.setMinutes(sessionEnd.getMinutes() + event.experience.duration)

            sessions.push({
              startTime: sessionStart,
              endTime: sessionEnd,
              eventId: event.id
            })
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (sessions.length > 0) {
        await prisma.session.createMany({ data: sessions })
      }
    }

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify event belongs to user's business and check for bookings
    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
        experience: {
          businessId: session.user.businessId
        }
      },
      include: {
        sessions: {
          include: {
            bookings: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if there are any bookings
    const hasBookings = event.sessions.some(session => session.bookings.length > 0)

    if (hasBookings) {
      return NextResponse.json(
        { error: 'Cannot delete event with existing bookings' },
        { status: 400 }
      )
    }

    await prisma.event.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}