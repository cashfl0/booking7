import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ShoppingCart } from 'lucide-react'

export default async function AddOnsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user.id) {
    return <div>No user session found</div>
  }

  // Find the business owned by this user
  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id }
  })

  if (!business) {
    return <div>No business associated with this account</div>
  }

  // Get all add-ons for this business (through products)
  const addOns = await prisma.addOn.findMany({
    where: {
      product: {
        experience: { businessId: business.id }
      }
    },
    include: {
      product: {
        select: {
          name: true,
          experience: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  // Get experiences count for the getting started guide
  const experienceCount = await prisma.experience.count({
    where: { businessId: business.id, isActive: true }
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add-ons</h1>
          <p className="text-gray-600">Manage reusable items customers can add to their bookings</p>
        </div>
        {experienceCount > 0 ? (
          <Button asChild>
            <Link href="/dashboard/products/addons/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Add-on
            </Link>
          </Button>
        ) : null}
      </div>

      {/* No Experiences Warning */}
      {experienceCount === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Create Experiences First</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-800">
            <p className="mb-4">
              You need to create at least one experience category before you can add add-ons.
              Add-ons are linked to specific products within experiences.
            </p>
            <Button asChild>
              <Link href="/dashboard/products/experiences">
                Create Your First Experience
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add-ons List */}
      {experienceCount > 0 && (
        <>
          {addOns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No add-ons yet</h3>
                <p className="text-gray-600 text-center mb-4 max-w-sm">
                  Create reusable add-on items that customers can add to their bookings, like socks, snacks, or equipment.
                </p>
                <Button asChild>
                  <Link href="/dashboard/products/addons/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Add-on
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {addOns.map((addOn) => (
                <Card key={addOn.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {addOn.name}
                          </h3>
                          <Badge variant={addOn.isActive ? "default" : "secondary"}>
                            {addOn.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            ${Number(addOn.price).toFixed(2)}
                          </Badge>
                        </div>

                        {addOn.description && (
                          <p className="text-gray-600 mb-3">
                            {addOn.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {addOn.product.experience.name} → {addOn.product.name}
                          </span>
                          <span>•</span>
                          <span>
                            Created {new Date(addOn.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/products/addons/${addOn.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Getting Started Guide */}
          {addOns.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800">
                <p className="mb-4">
                  Great! You have {addOns.length} add-on{addOns.length !== 1 ? 's' : ''} set up.
                  Now you can create events and include these add-ons for customers to purchase.
                </p>
                <Button asChild variant="outline" className="bg-white">
                  <Link href="/dashboard/products/events">
                    Create Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}