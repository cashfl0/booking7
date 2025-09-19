import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CreateGuestRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  zipCode: string
  marketingOptIn: boolean
  businessId: string
  sessionId: string
  ticketQuantity: number
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateGuestRequest = await request.json()

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.businessId || !data.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: data.businessId }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Verify session exists and belongs to business
    const session = await prisma.session.findFirst({
      where: {
        id: data.sessionId,
        event: {
          experience: {
            businessId: data.businessId
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if guest already exists with this email for this business
    let guest = await prisma.guest.findFirst({
      where: {
        email: data.email,
        businessId: data.businessId
      }
    })

    if (guest) {
      // Update existing guest with latest information
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          zipCode: data.zipCode,
          marketingOptIn: data.marketingOptIn,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new guest
      guest = await prisma.guest.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          zipCode: data.zipCode,
          marketingOptIn: data.marketingOptIn,
          businessId: data.businessId
        }
      })
    }

    // Store cart information for this guest/session (for abandoned cart remarketing)
    // This could be extended to store in a separate cart table if needed

    return NextResponse.json({
      id: guest.id,
      email: guest.email,
      message: 'Guest created successfully'
    })

  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}