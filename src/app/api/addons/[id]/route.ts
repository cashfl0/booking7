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

    // Verify the add-on belongs to this business
    const existingAddOn = await prisma.addOn.findFirst({
      where: {
        id,
        product: {
          experience: { businessId }
        }
      }
    })

    if (!existingAddOn) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Verify the new product belongs to this business
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        experience: { businessId }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 403 })
    }

    // Check if name is already in use for this product (excluding current add-on)
    const nameConflict = await prisma.addOn.findFirst({
      where: {
        productId,
        name,
        NOT: { id }
      }
    })

    if (nameConflict) {
      return NextResponse.json({ error: 'An add-on with this name already exists for this product' }, { status: 400 })
    }

    // Update the add-on
    const addOn = await prisma.addOn.update({
      where: { id },
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
    console.error('Error updating add-on:', error)
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

    // Find the add-on and verify ownership
    const addOn = await prisma.addOn.findFirst({
      where: {
        id,
        product: {
          experience: {
            business: {
              ownerId: session.user.id
            }
          }
        }
      }
    })

    if (!addOn) {
      return NextResponse.json({ error: 'Add-on not found or not authorized' }, { status: 404 })
    }

    // Delete the add-on
    await prisma.addOn.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Add-on deleted successfully' })

  } catch (error) {
    console.error('Error deleting add-on:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}