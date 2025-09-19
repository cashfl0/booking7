import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TicketSelectionClient } from '@/components/book/ticket-selection-client'

interface TicketSelectionPageProps {
  params: Promise<{
    businessSlug: string
    experienceSlug: string
    eventSlug: string
    sessionId: string
  }>
}

async function getSessionData(businessSlug: string, experienceSlug: string, eventSlug: string, sessionId: string) {
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

  // Get existing bookings for capacity calculation
  const existingBookings = await prisma.booking.findMany({
    where: {
      sessionId: session.id,
      status: {
        in: ['CONFIRMED', 'PENDING']
      }
    },
    select: {
      quantity: true
    }
  })

  const bookedQuantity = existingBookings.reduce((sum, booking) => sum + booking.quantity, 0)
  const availableCapacity = (session.maxCapacity || session.event.maxCapacity || session.event.experience.maxCapacity) - bookedQuantity

  // Filter active add-ons after query
  const activeAddOns = session.event.addOns
    .map(ea => ea.addOn)
    .filter(addOn => addOn.isActive)

  return {
    business,
    experience,
    event,
    session,
    availableCapacity,
    addOns: activeAddOns
  }
}

export default async function TicketSelectionPage({ params }: TicketSelectionPageProps) {
  const { businessSlug, experienceSlug, eventSlug, sessionId } = await params

  const data = await getSessionData(businessSlug, experienceSlug, eventSlug, sessionId)

  if (!data) {
    notFound()
  }

  const { business, experience, event, session, availableCapacity, addOns } = data

  if (availableCapacity <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Full</h1>
          <p className="text-gray-600 mb-6">This session is fully booked.</p>
          <a
            href={`/book/${business.slug}/${experience.slug}/${event.slug}`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Choose a different time
          </a>
        </div>
      </div>
    )
  }

  // Serialize data to avoid Decimal issues
  const serializedExperience = {
    ...experience,
    basePrice: Number(experience.basePrice)
  }

  const serializedSession = {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    event: {
      ...session.event,
      experience: {
        ...session.event.experience,
        basePrice: Number(session.event.experience.basePrice)
      }
    }
  }

  const serializedAddOns = addOns.map(addOn => ({
    ...addOn,
    price: Number(addOn.price)
  }))

  return (
    <TicketSelectionClient
      business={business}
      experience={serializedExperience}
      event={event}
      session={serializedSession}
      availableCapacity={availableCapacity}
      addOns={serializedAddOns}
    />
  )
}