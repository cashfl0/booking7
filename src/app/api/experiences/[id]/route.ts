import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, isActive, sortOrder, businessId } = body

    // Verify the user owns this business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: session.user.id
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found or not authorized' }, { status: 403 })
    }

    // Verify the experience belongs to this business
    const existingExperience = await prisma.experience.findFirst({
      where: {
        id,
        businessId
      }
    })

    if (!existingExperience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    // Check if slug is already in use for this business (excluding current experience)
    const slugConflict = await prisma.experience.findFirst({
      where: {
        businessId,
        slug,
        NOT: { id }
      }
    })

    if (slugConflict) {
      return NextResponse.json({ error: 'A experience with this URL slug already exists' }, { status: 400 })
    }

    // Update the experience
    const experience = await prisma.experience.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        isActive: !!isActive,
        sortOrder: sortOrder || 1
      }
    })

    return NextResponse.json(experience)

  } catch (error) {
    console.error('Error updating experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the experience and verify ownership
    const experience = await prisma.experience.findFirst({
      where: {
        id,
        business: {
          ownerId: session.user.id
        }
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found or not authorized' }, { status: 404 })
    }

    // Check if experience has any products
    if (experience._count.products > 0) {
      return NextResponse.json({
        error: 'Cannot delete experience with existing products. Delete all products first.'
      }, { status: 400 })
    }

    // Delete the experience
    await prisma.experience.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Experience deleted successfully' })

  } catch (error) {
    console.error('Error deleting experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}