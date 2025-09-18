import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GuestsPageClient } from '@/components/dashboard/guests-page-client'

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  _count: {
    bookings: number
  }
  bookings: Array<{
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    total: number
    session: {
      event: {
        name: string
        experience: {
          name: string
        }
      }
    }
  }>
}

interface Experience {
  id: string
  name: string
}

interface Event {
  id: string
  name: string
  experienceId: string
}

async function getGuestsData(
  page: number = 1,
  limit: number = 50,
  search?: string
): Promise<{
  guests: Guest[]
  totalCount: number
  experiences: Experience[]
  events: Event[]
}> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.businessId) {
    redirect('/auth/signin')
  }

  const skip = (page - 1) * limit

  // Build search conditions
  const searchConditions = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          {
            bookings: {
              some: {
                OR: [
                  { id: { contains: search, mode: 'insensitive' as const } },
                  {
                    session: {
                      id: { contains: search, mode: 'insensitive' as const }
                    }
                  },
                  {
                    session: {
                      event: {
                        id: { contains: search, mode: 'insensitive' as const }
                      }
                    }
                  },
                  {
                    session: {
                      event: {
                        experience: {
                          id: { contains: search, mode: 'insensitive' as const }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    : {}

  // Base where clause - only guests who have bookings for this business
  const baseWhere = {
    bookings: {
      some: {
        session: {
          event: {
            experience: {
              businessId: session.user.businessId
            }
          }
        }
      }
    },
    ...searchConditions
  }

  // Get total count
  const totalCount = await prisma.guest.count({
    where: baseWhere
  })

  // Get guests with pagination
  const guests = await prisma.guest.findMany({
    where: baseWhere,
    include: {
      _count: {
        select: {
          bookings: {
            where: {
              session: {
                event: {
                  experience: {
                    businessId: session.user.businessId
                  }
                }
              }
            }
          }
        }
      },
      bookings: {
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
          session: {
            include: {
              event: {
                include: {
                  experience: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3 // Show last 3 bookings per guest
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take: limit
  })

  // Get experiences for filter
  const experiences = await prisma.experience.findMany({
    where: {
      businessId: session.user.businessId
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Get events for filter
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

  // Transform the data
  const transformedGuests = guests.map(guest => ({
    ...guest,
    createdAt: guest.createdAt.toISOString(),
    bookings: guest.bookings.map(booking => ({
      ...booking,
      total: Number(booking.total)
    }))
  }))

  return {
    guests: transformedGuests,
    totalCount,
    experiences,
    events
  }
}

interface GuestsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page as string) : 1
  const search = resolvedSearchParams.search as string | undefined

  const { guests, totalCount, experiences, events } = await getGuestsData(page, 50, search)

  return (
    <GuestsPageClient
      initialGuests={guests}
      totalCount={totalCount}
      currentPage={page}
      experiences={experiences}
      events={events}
    />
  )
}