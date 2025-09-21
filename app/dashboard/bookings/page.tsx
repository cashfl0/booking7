import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
// Components are used in BookingsPageClient
import { BookingsPageClient } from '@/components/dashboard/bookings-page-client'

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
  items: Array<{
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
  }>
}

interface Experience {
  id: string
  name: string
  slug: string
}

interface Event {
  id: string
  name: string
  experienceId: string
}

async function getBookingsData(): Promise<{
  bookings: Booking[]
  experiences: Experience[]
  events: Event[]
}> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.businessId) {
    redirect('/auth/signin')
  }

  // Fetch bookings
  const bookings = await prisma.booking.findMany({
    where: {
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
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Initial load limit
  })

  // Fetch experiences for filter
  const experiences = await prisma.experience.findMany({
    where: {
      businessId: session.user.businessId
    },
    select: {
      id: true,
      name: true,
      slug: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Fetch events for filter
  const events = await prisma.event.findMany({
    where: {
      experience: {
        businessId: session.user.businessId
      }
    },
    select: {
      id: true,
      name: true,
      experienceId: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Transform decimal fields to numbers
  const transformedBookings = bookings.map(booking => ({
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
  }))

  return {
    bookings: transformedBookings,
    experiences,
    events
  }
}

export default async function BookingsPage() {
  const { bookings, experiences, events } = await getBookingsData()

  return (
    <BookingsPageClient
      initialBookings={bookings}
      experiences={experiences}
      events={events}
    />
  )
}