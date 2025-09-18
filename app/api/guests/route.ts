import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const guestSearchSchema = z.object({
  search: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).optional()
})

const createGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal(''))
})

// GET guests with search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { search, limit } = guestSearchSchema.parse({
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined
    })

    let whereClause = {}

    if (search) {
      whereClause = {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }
    }

    const guests = await prisma.guest.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      take: limit || 20
    })

    return NextResponse.json(guests)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new guest
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createGuestSchema.parse(body)

    // Check for duplicate email
    const existingGuest = await prisma.guest.findFirst({
      where: {
        email: validatedData.email
      }
    })

    if (existingGuest) {
      return NextResponse.json({
        error: 'Validation error',
        details: [{
          path: ['email'],
          message: 'A guest with this email already exists'
        }]
      }, { status: 400 })
    }

    const guest = await prisma.guest.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone || null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error creating guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}