import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
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

    // Check if slug is already in use for this business
    const existingExperience = await prisma.experience.findFirst({
      where: {
        businessId,
        slug
      }
    })

    if (existingExperience) {
      return NextResponse.json({ error: 'A experience with this URL slug already exists' }, { status: 400 })
    }

    // Create the experience
    const experience = await prisma.experience.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        businessId,
        isActive: !!isActive,
        sortOrder: sortOrder || 1
      }
    })

    return NextResponse.json(experience)

  } catch (error) {
    console.error('Error creating experience:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}