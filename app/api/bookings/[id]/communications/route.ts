import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify booking belongs to the user's business
    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        session: {
          event: {
            experience: {
              businessId: session.user.businessId
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Fetch communication history
    const communications = await prisma.bookingCommunication.findMany({
      where: {
        bookingId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for frontend
    const transformedCommunications = communications.map(comm => ({
      id: comm.id,
      type: comm.type,
      channel: comm.channel,
      direction: comm.direction,
      status: comm.status,
      subject: comm.subject,
      content: comm.content,
      fromAddress: comm.fromAddress,
      toAddress: comm.toAddress,
      sentAt: comm.sentAt?.toISOString(),
      deliveredAt: comm.deliveredAt?.toISOString(),
      receivedAt: comm.receivedAt?.toISOString(),
      errorMessage: comm.errorMessage,
      messageId: comm.messageId,
      createdAt: comm.createdAt.toISOString(),
      updatedAt: comm.updatedAt.toISOString()
    }))

    return NextResponse.json(transformedCommunications)

  } catch (error) {
    console.error('Error fetching booking communications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}