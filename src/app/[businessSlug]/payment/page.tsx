import PaymentClient from './payment-client'

interface PaymentPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { businessSlug } = await params

  return <PaymentClient businessSlug={businessSlug} />
}