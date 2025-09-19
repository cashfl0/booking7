import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CompleteBookingFlow } from '@/components/book/complete-booking-flow'

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
      experience: true,
      addOns: {
        include: {
          addOn: true
        }
      }
    }
  })

  if (!event) {
    return null
  }

  // Filter active add-ons after query
  const activeAddOns = event.addOns
    .map(ea => ea.addOn)
    .filter(addOn => addOn.isActive)

  return {
    business,
    experience,
    event,
    addOns: activeAddOns
  }
}

export default async function SessionSelectionPage({ params }: SessionSelectionPageProps) {
  const { businessSlug, experienceSlug, eventSlug } = await params

  const data = await getEventData(businessSlug, experienceSlug, eventSlug)

  if (!data) {
    notFound()
  }

  const { business, experience, event, addOns } = data

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

  // Serialize add-ons
  const serializedAddOns = addOns.map(addOn => ({
    ...addOn,
    price: Number(addOn.price)
  }))

  return (
    <CompleteBookingFlow
      business={business}
      experience={serializedExperience}
      event={serializedEvent}
      sessionsByDate={sessionsByDate}
      addOns={serializedAddOns}
    />
  )
}