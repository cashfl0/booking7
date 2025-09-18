import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addonUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  price: z.number().positive('Price must be positive').max(9999.99, 'Price too high'),
  isActive: z.boolean(),
  sortOrder: z.number().int().positive()
})

// GET single add-on
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addon = await prisma.addOn.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      include: {
        _count: {
          select: {
            bookingItems: true,
            events: true
          }
        },
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                experience: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!addon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...addon,
      price: Number(addon.price)
    })
  } catch (error) {
    console.error('Error fetching add-on:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update add-on
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addonUpdateSchema.parse(body)

    // Check if add-on exists and belongs to user's business
    const existingAddon = await prisma.addOn.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!existingAddon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Check for duplicate name within the same business (excluding current add-on)
    const duplicateAddon = await prisma.addOn.findFirst({
      where: {
        businessId: session.user.businessId,
        name: validatedData.name,
        NOT: { id }
      }
    })

    if (duplicateAddon) {
      return NextResponse.json({
        error: 'Validation error',
        details: [{
          path: ['name'],
          message: 'An add-on with this name already exists'
        }]
      }, { status: 400 })
    }

    const addon = await prisma.addOn.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        isActive: validatedData.isActive,
        sortOrder: validatedData.sortOrder
      },
      include: {
        _count: {
          select: {
            bookingItems: true,
            events: true
          }
        }
      }
    })

    return NextResponse.json({
      ...addon,
      price: Number(addon.price)
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error updating add-on:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE add-on
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if add-on exists and belongs to user's business
    const addon = await prisma.addOn.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      include: {
        _count: {
          select: {
            bookingItems: true
          }
        }
      }
    })

    if (!addon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Prevent deletion if add-on has bookings
    if (addon._count.bookingItems > 0) {
      return NextResponse.json({
        error: 'Cannot delete add-on',
        message: 'This add-on has existing bookings and cannot be deleted'
      }, { status: 400 })
    }

    // Delete the add-on (this will cascade delete EventAddOn entries)
    await prisma.addOn.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Add-on deleted successfully' })
  } catch (error) {
    console.error('Error deleting add-on:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}