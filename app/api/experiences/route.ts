import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const experienceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Price must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  maxCapacity: z.number().min(1, 'Capacity must be at least 1'),
  isActive: z.boolean().default(true)
})

// GET all experiences for the business
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const experiences = await prisma.experience.findMany({
      where: {
        businessId: session.user.businessId
      },
      include: {
        business: {
          select: {
            slug: true
          }
        },
        events: {
          include: {
            sessions: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Serialize Decimal values to avoid client component issues
    const serializedExperiences = experiences.map(experience => ({
      ...experience,
      basePrice: Number(experience.basePrice)
    }))

    return NextResponse.json(serializedExperiences)
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new experience
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = experienceSchema.parse(body)

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug already exists for this business
    const existingExperience = await prisma.experience.findUnique({
      where: {
        businessId_slug: {
          businessId: session.user.businessId,
          slug: slug
        }
      }
    })

    if (existingExperience) {
      return NextResponse.json({ error: 'An experience with this name already exists' }, { status: 400 })
    }

    const experience = await prisma.experience.create({
      data: {
        ...validatedData,
        slug,
        businessId: session.user.businessId
      }
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }

    console.error('Error creating experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}