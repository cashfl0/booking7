import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ConfirmationClient } from '@/components/book/confirmation-client'

interface ConfirmationPageProps {
  params: Promise<{
    businessSlug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getConfirmationData(businessSlug: string, bookingId: string) {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug }
  })

  if (!business) {
    return null
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      guest: {
        businessId: business.id
      }
    },
    include: {
      guest: true,
      session: {
        include: {
          event: {
            include: {
              experience: true
            }
          }
        }
      }
    }
  })

  if (!booking) {
    return null
  }

  return {
    business,
    booking
  }
}

export default async function ConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { businessSlug } = await params
  const resolvedSearchParams = await searchParams

  const bookingId = resolvedSearchParams.bookingId as string

  if (!bookingId) {
    notFound()
  }

  const data = await getConfirmationData(businessSlug, bookingId)

  if (!data) {
    notFound()
  }

  const { business, booking } = data

  // Serialize Decimal and Date values
  const serializedBooking = {
    ...booking,
    total: Number(booking.total),
    session: {
      ...booking.session,
      startTime: booking.session.startTime.toISOString(),
      endTime: booking.session.endTime.toISOString(),
      event: {
        ...booking.session.event,
        experience: {
          ...booking.session.event.experience,
          basePrice: Number(booking.session.event.experience.basePrice)
        }
      }
    }
  }

  return (
    <ConfirmationClient
      business={business}
      booking={serializedBooking}
    />
  )
}