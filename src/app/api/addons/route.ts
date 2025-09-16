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
    const { name, description, price, productId, isActive, sortOrder, businessId } = body

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

    // Verify the product belongs to this business
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        experience: { businessId }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 403 })
    }

    // Check if name is already in use for this product
    const existingAddOn = await prisma.addOn.findFirst({
      where: {
        productId,
        name
      }
    })

    if (existingAddOn) {
      return NextResponse.json({ error: 'An add-on with this name already exists for this product' }, { status: 400 })
    }

    // Create the add-on
    const addOn = await prisma.addOn.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        productId,
        isActive: !!isActive,
        sortOrder: sortOrder || 1
      }
    })

    return NextResponse.json(addOn)

  } catch (error) {
    console.error('Error creating add-on:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}