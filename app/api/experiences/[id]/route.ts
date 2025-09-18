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

// GET single experience
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const experience = await prisma.experience.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId
      },
      include: {
        events: {
          include: {
            sessions: true,
            addOns: true
          }
        }
      }
    })

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    return NextResponse.json(experience)
  } catch (error) {
    console.error('Error fetching experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update experience
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify experience belongs to user's business
    const existingExperience = await prisma.experience.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId
      }
    })

    if (!existingExperience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = experienceSchema.parse(body)

    // Generate new slug if name changed
    let slug = existingExperience.slug
    if (validatedData.name !== existingExperience.name) {
      slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Check if new slug conflicts with existing experience
      const conflictingExperience = await prisma.experience.findUnique({
        where: {
          businessId_slug: {
            businessId: session.user.businessId,
            slug: slug
          }
        }
      })

      if (conflictingExperience && conflictingExperience.id !== params.id) {
        return NextResponse.json({ error: 'An experience with this name already exists' }, { status: 400 })
      }
    }

    const experience = await prisma.experience.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        slug
      }
    })

    return NextResponse.json(experience)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    console.error('Error updating experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE experience
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify experience belongs to user's business
    const experience = await prisma.experience.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId
      },
      include: {
        events: {
          include: {
            sessions: {
              include: {
                bookings: true
              }
            }
          }
        }
      }
    })

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    // Check if there are any bookings
    const hasBookings = experience.events.some(event =>
      event.sessions.some(session => session.bookings.length > 0)
    )

    if (hasBookings) {
      return NextResponse.json(
        { error: 'Cannot delete experience with existing bookings' },
        { status: 400 }
      )
    }

    await prisma.experience.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Experience deleted successfully' })
  } catch (error) {
    console.error('Error deleting experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}