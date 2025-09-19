import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ProcessPaymentRequest {
  guest: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    marketingOptIn: boolean
    termsAccepted: boolean
    businessId: string
  }
  booking: {
    sessionId: string
    quantity: number
    total: number
    items: Array<{
      quantity: number
      unitPrice: number
      totalPrice: number
      itemType: 'SESSION' | 'ADD_ON'
      addOnId?: string | null
    }>
  }
  payment?: {
    cardNumber: string
    expiryDate: string
    cvv: string
    nameOnCard: string
    billingZip: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ProcessPaymentRequest = await request.json()

    // Validate required fields
    if (!data.guest || !data.booking || !data.guest.email || !data.booking.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        firstName: data.guest.firstName,
        lastName: data.guest.lastName,
        email: data.guest.email,
        phone: data.guest.phone || null,
        marketingOptIn: data.guest.marketingOptIn,
        businessId: data.guest.businessId
      }
    })

    // TODO: Integrate with Stripe payment processing
    // For now, we'll simulate a successful payment

    // Create the booking with items
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        sessionId: data.booking.sessionId,
        quantity: data.booking.quantity,
        total: data.booking.total,
        status: 'CONFIRMED',
        items: {
          create: data.booking.items
        }
      },
      include: {
        items: true
      }
    })

    // Update session capacity
    await prisma.session.update({
      where: { id: data.booking.sessionId },
      data: {
        currentCount: {
          increment: data.booking.quantity
        }
      }
    })

    // TODO: Send confirmation email
    // TODO: Create calendar events
    // TODO: Send SMS notifications

    return NextResponse.json({
      bookingId: booking.id,
      status: 'success',
      message: 'Payment processed successfully'
    })

  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}