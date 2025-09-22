import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingDetailClient } from '@/components/dashboard/booking-detail-client'

interface BookingItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  itemType: 'SESSION' | 'ADD_ON'
  addOn?: {
    id: string
    name: string
    price: number
  } | null
}

interface Booking {
  id: string
  quantity: number
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  session: {
    id: string
    startTime: string
    endTime: string
    event: {
      id: string
      name: string
      experience: {
        id: string
        name: string
        slug: string
      }
    }
  }
  items: BookingItem[]
}

interface Props {
  params: Promise<{ bookingId: string }>
}

async function getBooking(bookingId: string): Promise<Booking | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.businessId) {
    redirect('/auth/signin')
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      session: {
        event: {
          experience: {
            businessId: session.user.businessId
          }
        }
      }
    },
    include: {
      guest: true,
      session: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              experience: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      },
      items: {
        include: {
          addOn: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        }
      }
    }
  })

  if (!booking) {
    return null
  }

  // Transform decimal fields to numbers
  return {
    ...booking,
    total: Number(booking.total),
    createdAt: booking.createdAt.toISOString(),
    session: {
      ...booking.session,
      startTime: booking.session.startTime.toISOString(),
      endTime: booking.session.endTime.toISOString()
    },
    items: booking.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      addOn: item.addOn ? {
        ...item.addOn,
        price: Number(item.addOn.price)
      } : null
    }))
  }
}

export default async function BookingDetailPage({ params }: Props) {
  const { bookingId } = await params
  const booking = await getBooking(bookingId)

  if (!booking) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">
            #{booking.id.slice(-8)} • {booking.guest.firstName} {booking.guest.lastName}
          </p>
        </div>
      </div>

      {/* Main content */}
      <BookingDetailClient booking={booking} />
    </div>
  )
}