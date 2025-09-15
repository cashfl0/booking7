import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardOverview from '@/components/dashboard/dashboard-overview'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user.id) {
    return <div>No user session found</div>
  }

  // Find the business owned by this user
  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id }
  })

  if (!business) {
    return <div>No business associated with this account</div>
  }

  // Get today's date range
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  // Fetch today's metrics
  const [
    todayBookings,
    todayRevenue,
    todayGuests,
    upcomingSessions,
    totalCustomers,
    recentBookings
  ] = await Promise.all([
    // Today's bookings count
    prisma.booking.count({
      where: {
        session: {
          product: {
            experience: { businessId: business.id }
          }
        },
        createdAt: { gte: startOfDay, lt: endOfDay },
        status: { not: 'CANCELLED' }
      }
    }),

    // Today's revenue
    prisma.booking.aggregate({
      where: {
        session: {
          product: {
            experience: { businessId: business.id }
          }
        },
        createdAt: { gte: startOfDay, lt: endOfDay },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      },
      _sum: { total: true }
    }),

    // Today's guest count (sum of all booking items quantities)
    prisma.bookingItem.aggregate({
      where: {
        booking: {
          session: {
            product: {
              experience: { businessId: business.id }
            }
          },
          createdAt: { gte: startOfDay, lt: endOfDay },
          status: { not: 'CANCELLED' }
        }
      },
      _sum: { quantity: true }
    }),

    // Upcoming sessions (next 3 hours)
    prisma.session_Product.findMany({
      where: {
        product: {
          experience: { businessId: business.id }
        },
        startTime: {
          gte: new Date(),
          lte: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours from now
        }
      },
      include: {
        product: { select: { name: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: 'asc' },
      take: 5
    }),

    // Total customers
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        bookings: {
          some: {
            session: {
              product: {
                experience: { businessId: business.id }
              }
            }
          }
        }
      }
    }),

    // Recent bookings
    prisma.booking.findMany({
      where: {
        session: {
          product: {
            experience: { businessId: business.id }
          }
        }
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        session: {
          select: {
            startTime: true,
            endTime: true,
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  const metrics = {
    todayRevenue: Number(todayRevenue._sum.total || 0),
    todayBookings,
    todayGuests: Number(todayGuests._sum.quantity || 0),
    totalCustomers,
    upcomingSessions: upcomingSessions.map(session => ({
      id: session.id,
      productName: session.product.name,
      startTime: session.startTime,
      endTime: session.endTime,
      bookingCount: session._count.bookings,
      capacity: session.capacity
    })),
    recentBookings: recentBookings.map(booking => ({
      id: booking.id,
      customerName: booking.user
        ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || 'User'
        : `${booking.customerFirstName || ''} ${booking.customerLastName || ''}`.trim() || 'Guest',
      customerEmail: booking.user?.email || booking.customerEmail,
      productName: booking.session?.product.name || 'Unknown Product',
      sessionTime: booking.session?.startTime,
      amount: Number(booking.total),
      status: booking.status,
      createdAt: booking.createdAt
    }))
  }

  return <DashboardOverview metrics={metrics} />
}