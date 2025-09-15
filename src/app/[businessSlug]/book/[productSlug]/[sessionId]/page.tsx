import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TicketSelection from './ticket-selection'

interface TicketPageProps {
  params: Promise<{ businessSlug: string; productSlug: string; sessionId: string }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { businessSlug, productSlug, sessionId } = await params

  // Fetch business
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug }
  })

  if (!business) {
    notFound()
  }

  // Fetch product with ticket types and add-ons
  const product = await prisma.product.findFirst({
    where: {
      slug: productSlug,
      experience: {
        businessId: business.id
      }
    },
    include: {
      experience: true,
      ticketTypes: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      },
      addOns: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Fetch session
  const session = await prisma.session_Product.findUnique({
    where: { id: sessionId },
    include: {
      product: true
    }
  })

  if (!session || session.productId !== product.id) {
    notFound()
  }

  // Get other available sessions for the same day
  const sessionDate = new Date(session.startTime)
  sessionDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(sessionDate)
  nextDay.setDate(sessionDate.getDate() + 1)

  const otherSessions = await prisma.session_Product.findMany({
    where: {
      productId: product.id,
      startTime: {
        gte: sessionDate,
        lt: nextDay
      },
      isActive: true
    },
    orderBy: { startTime: 'asc' }
  })

  // Convert Decimal objects to numbers for client component
  const serializedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    imageUrl: product.imageUrl,
    basePrice: Number(product.basePrice),
    duration: product.duration,
    isActive: product.isActive,
    sortOrder: product.sortOrder,
    maxCapacity: product.maxCapacity,
    experienceId: product.experienceId,
    ticketTypes: product.ticketTypes.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      price: Number(ticket.price),
      minAge: ticket.minAge,
      maxAge: ticket.maxAge,
      requiresTicketTypeId: ticket.requiresTicketTypeId,
    })),
    addOns: product.addOns.map(addon => ({
      id: addon.id,
      name: addon.name,
      description: addon.description,
      price: Number(addon.price),
      imageUrl: addon.imageUrl,
      isRequired: addon.isRequired,
    }))
  }

  return (
    <TicketSelection
      product={serializedProduct}
      session={session}
      otherSessions={otherSessions}
      businessSlug={businessSlug}
      productSlug={productSlug}
    />
  )
}