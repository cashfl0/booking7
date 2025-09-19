import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CheckoutClient } from '@/components/book/checkout-client'

interface CheckoutPageProps {
  params: Promise<{
    businessSlug: string
    experienceSlug: string
    eventSlug: string
    sessionId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getCheckoutData(businessSlug: string, experienceSlug: string, eventSlug: string, sessionId: string) {
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
    }
  })

  if (!event) {
    return null
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      eventId: event.id,
      startTime: {
        gte: new Date()
      }
    },
    include: {
      event: {
        include: {
          experience: true,
          addOns: {
            include: {
              addOn: true
            }
          }
        }
      }
    }
  })

  if (!session) {
    return null
  }

  // Filter active add-ons after query
  const activeAddOns = session.event.addOns
    .map(ea => ea.addOn)
    .filter(addOn => addOn.isActive)

  return {
    business,
    experience,
    event,
    session,
    addOns: activeAddOns
  }
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { businessSlug, experienceSlug, eventSlug, sessionId } = await params
  const resolvedSearchParams = await searchParams

  const data = await getCheckoutData(businessSlug, experienceSlug, eventSlug, sessionId)

  if (!data) {
    notFound()
  }

  const { business, experience, event, session } = data

  // Serialize data to avoid Decimal issues
  const serializedExperience = {
    ...experience
  }

  const serializedSession = {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    event: {
      ...session.event,
      basePrice: Number(session.event.basePrice),
      experience: {
        ...session.event.experience
      }
    }
  }


  return (
    <CheckoutClient
      business={business}
      experience={serializedExperience}
      event={serializedSession.event}
      session={serializedSession}
      initialCart={resolvedSearchParams}
    />
  )
}