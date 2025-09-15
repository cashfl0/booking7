import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CreateExperienceForm from '@/components/dashboard/create-experience-form'

export default async function NewExperiencePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user.id) {
    redirect('/api/auth/signin')
  }

  // Find the business owned by this user
  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id }
  })

  if (!business) {
    return <div>No business associated with this account</div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Experience</h1>
        <p className="text-gray-600">Set up a new experience category for your products</p>
      </div>

      <CreateExperienceForm businessId={business.id} />
    </div>
  )
}