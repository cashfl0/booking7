import CheckoutClient from './checkout-client'

interface CheckoutPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { businessSlug } = await params

  return <CheckoutClient businessSlug={businessSlug} />
}