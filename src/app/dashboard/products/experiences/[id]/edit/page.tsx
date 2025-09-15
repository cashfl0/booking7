import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import EditExperienceForm from '@/components/dashboard/edit-experience-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditExperiencePage({ params }: PageProps) {
  const { id } = await params
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

  // Get the experience
  const experience = await prisma.experience.findFirst({
    where: {
      id,
      businessId: business.id
    },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true } }
        }
      }
    }
  })

  if (!experience) {
    notFound()
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Experience</h1>
        <p className="text-gray-600">Update the details for {experience.name}</p>
      </div>

      <EditExperienceForm
        experience={experience}
        businessId={business.id}
        productCount={experience._count.products}
      />
    </div>
  )
}