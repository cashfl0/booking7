import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CreateAddOnForm from '@/components/dashboard/create-addon-form'

export default async function NewAddOnPage() {
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

  if (products.length === 0) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Add-on</h1>
          <p className="text-gray-600">You need to create products before you can add add-ons</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <p className="text-orange-800">
            Add-ons are linked to specific products. You'll need to create at least one product in an experience first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Add-on</h1>
        <p className="text-gray-600">Add a reusable item that customers can add to their bookings</p>
      </div>

      <CreateAddOnForm businessId={business.id} products={products} />
    </div>
  )
}