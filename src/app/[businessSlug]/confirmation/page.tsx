import ConfirmationClient from './confirmation-client'

interface ConfirmationPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { businessSlug } = await params

  return <ConfirmationClient businessSlug={businessSlug} />
}