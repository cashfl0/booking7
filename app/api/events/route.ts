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

// GET events (filtered by experienceId if provided)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const experienceId = searchParams.get('experienceId')

    const whereClause: any = {
      experience: {
        businessId: session.user.businessId
      }
    }

    if (experienceId) {
      whereClause.experienceId = experienceId
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        sessions: true,
        experience: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const event = await prisma.event.create({
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

    // Create sessions if session times and days are provided
    if (validatedData.sessionTimes && validatedData.selectedDays) {
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

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}