import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SessionSelectionClient } from '@/components/book/session-selection-client'

interface SessionSelectionPageProps {
  params: Promise<{
    businessSlug: string
    experienceSlug: string
    eventSlug: string
  }>
}

async function getEventData(businessSlug: string, experienceSlug: string, eventSlug: string) {
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
    }
  })

  if (!experience) {
    return null
  }

  const event = await prisma.event.findFirst({
    where: {
      slug: eventSlug,
      experienceId: experience.id,
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
        }
      },
      experience: true
    }
  })

  if (!event) {
    return null
  }

  return {
    business,
    experience,
    event
  }
}

export default async function SessionSelectionPage({ params }: SessionSelectionPageProps) {
  const { businessSlug, experienceSlug, eventSlug } = await params

  const data = await getEventData(businessSlug, experienceSlug, eventSlug)

  if (!data) {
    notFound()
  }

  const { business, experience, event } = data

  // Serialize sessions by converting Date to string
  const serializedSessions = event.sessions.map(session => ({
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString()
  }))

  // Group sessions by date
  const sessionsByDate = serializedSessions.reduce((acc, session) => {
    const date = new Date(session.startTime).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(session)
    return acc
  }, {} as Record<string, typeof serializedSessions>)

  // Serialize other data
  const serializedExperience = {
    ...experience
  }

  const serializedEvent = {
    ...event,
    basePrice: Number(event.basePrice),
    sessions: serializedSessions,
    experience: serializedExperience
  }

  return (
    <SessionSelectionClient
      business={business}
      experience={serializedExperience}
      event={serializedEvent}
      sessionsByDate={sessionsByDate}
    />
  )
}