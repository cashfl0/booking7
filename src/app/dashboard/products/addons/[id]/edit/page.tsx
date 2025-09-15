import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import EditAddOnForm from '@/components/dashboard/edit-addon-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAddOnPage({ params }: PageProps) {
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

  // Get the add-on
  const addOn = await prisma.addOn.findFirst({
    where: {
      id,
      product: {
        experience: { businessId: business.id }
      }
    },
    include: {
      product: {
        include: {
          experience: {
            select: { name: true }
          }
        }
      }
    }
  })

  if (!addOn) {
    notFound()
  }

  // Get all products for this business to select from
  const products = await prisma.product.findMany({
    where: {
      experience: { businessId: business.id },
      isActive: true
    },
    include: {
      experience: {
        select: { name: true }
      }
    },
    orderBy: [
      { experience: { sortOrder: 'asc' } },
      { sortOrder: 'asc' }
    ]
  })

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Add-on</h1>
        <p className="text-gray-600">Update the details for {addOn.name}</p>
      </div>

      <EditAddOnForm
        addOn={addOn}
        products={products}
        businessId={business.id}
      />
    </div>
  )
}