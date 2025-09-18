import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  price: z.number().positive('Price must be positive').max(9999.99, 'Price too high'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().positive().default(1)
})

// GET add-ons for the business
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addons = await prisma.addOn.findMany({
      where: {
        businessId: session.user.businessId
      },
      include: {
        _count: {
          select: {
            bookingItems: true,
            events: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(addons.map(addon => ({
      ...addon,
      price: Number(addon.price)
    })))
  } catch (error) {
    console.error('Error fetching add-ons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new add-on
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addonSchema.parse(body)

    // Check for duplicate add-on name within the same business
    const existingAddon = await prisma.addOn.findFirst({
      where: {
        businessId: session.user.businessId,
        name: validatedData.name
      }
    })

    if (existingAddon) {
      return NextResponse.json({
        error: 'Validation error',
        details: [{
          path: ['name'],
          message: 'An add-on with this name already exists'
        }]
      }, { status: 400 })
    }

    const addon = await prisma.addOn.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        isActive: validatedData.isActive,
        sortOrder: validatedData.sortOrder,
        businessId: session.user.businessId
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
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error creating add-on:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}