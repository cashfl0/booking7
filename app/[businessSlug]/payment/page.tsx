import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PaymentClient } from '@/components/book/payment-client'

interface PaymentPageProps {
  params: Promise<{
    businessSlug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getPaymentData(businessSlug: string, guestId: string) {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug }
  })

  if (!business) {
    return null
  }

  const guest = await prisma.guest.findFirst({
    where: {
      id: guestId,
      businessId: business.id
    }
  })

  if (!guest) {
    return null
  }

  return {
    business,
    guest
  }
}

export default async function PaymentPage({ params, searchParams }: PaymentPageProps) {
  const { businessSlug } = await params
  const resolvedSearchParams = await searchParams

  const guestId = resolvedSearchParams.guestId as string
  const sessionId = resolvedSearchParams.sessionId as string
  const tickets = parseInt(resolvedSearchParams.tickets as string) || 0
  const total = parseFloat(resolvedSearchParams.total as string) || 0

  if (!guestId || !sessionId || !tickets || !total) {
    notFound()
  }

  const data = await getPaymentData(businessSlug, guestId)

  if (!data) {
    notFound()
  }

  const { business, guest } = data

  return (
    <PaymentClient
      business={business}
      guest={guest}
      sessionId={sessionId}
      tickets={tickets}
      total={total}
    />
  )
}