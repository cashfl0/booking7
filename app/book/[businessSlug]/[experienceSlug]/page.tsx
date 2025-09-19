import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EventsListClient } from '@/components/book/events-list-client'

interface EventsPageProps {
  params: Promise<{
    businessSlug: string
    experienceSlug: string
  }>
}

async function getExperienceData(businessSlug: string, experienceSlug: string) {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug }
  })

  if (!business) {
    return null
  }

  const experience = await prisma.experience.findFirst({
    where: {
      slug: experienceSlug,
      businessId: business.id
    },
    include: {
      events: {
        where: {
          isActive: true
        },
        include: {
          sessions: {
            where: {
              startTime: {
                gte: new Date()
              },
              isActive: true
            },
            include: {
              _count: {
                select: {
                  bookings: {
                    where: {
                      status: {
                        in: ['CONFIRMED', 'PENDING']
                      }
                    }
                  }
                }
              }
            },
            orderBy: {
              startTime: 'asc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }
    }
  })

  if (!experience) {
    return null
  }

  return {
    business,
    experience
  }
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { businessSlug, experienceSlug } = await params

  const data = await getExperienceData(businessSlug, experienceSlug)

  if (!data) {
    notFound()
  }

  const { business, experience } = data

  // Filter events that have available sessions and serialize data
  const availableEvents = experience.events
    .filter(event => event.sessions.length > 0)
    .map(event => {
      // Calculate available sessions (not full)
      const availableSessions = event.sessions.filter(session => {
        const maxCapacity = session.maxCapacity || event.maxCapacity || experience.maxCapacity
        const bookedCount = session._count?.bookings || 0
        return bookedCount < maxCapacity
      })

      return {
        ...event,
        basePrice: Number(event.basePrice),
        availableSessionsCount: availableSessions.length,
        sessions: event.sessions.map(session => ({
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime.toISOString(),
          availableSpots: (session.maxCapacity || event.maxCapacity || experience.maxCapacity) - (session._count?.bookings || 0)
        }))
      }
    })

  // Serialize experience data
  const serializedExperience = {
    ...experience,
    events: availableEvents
  }

  return (
    <EventsListClient
      business={business}
      experience={serializedExperience}
      events={availableEvents}
    />
  )
}