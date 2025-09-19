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
              }
            },
            orderBy: {
              startTime: 'asc'
            },
            take: 1
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
    .map(event => ({
      ...event,
      sessions: event.sessions.map(session => ({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString()
      }))
    }))

  // Serialize experience data
  const serializedExperience = {
    ...experience,
    basePrice: Number(experience.basePrice),
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