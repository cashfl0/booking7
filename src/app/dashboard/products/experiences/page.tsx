import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'

export default async function ExperiencesPage() {
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

  // Get all experiences for this business
  const experiences = await prisma.experience.findMany({
    where: { businessId: business.id },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true } }
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Experiences</h1>
          <p className="text-gray-600">Manage your experience categories</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/experiences/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Experience
          </Link>
        </Button>
      </div>

      {/* Experiences List */}
      {experiences.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No experiences yet</h3>
            <p className="text-gray-600 text-center mb-4 max-w-sm">
              Create your first experience category to start organizing your products and events.
            </p>
            <Button asChild>
              <Link href="/dashboard/products/experiences/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Experience
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiences.map((experience) => (
            <Card key={experience.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {experience.name}
                      </h3>
                      <Badge variant={experience.isActive ? "default" : "secondary"}>
                        {experience.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {experience.description && (
                      <p className="text-gray-600 mb-3">
                        {experience.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {experience._count.products} product{experience._count.products !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>
                        Created {new Date(experience.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/products/experiences/${experience.id}/edit`}>
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
      {experiences.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p className="mb-4">
              Great! You have {experiences.length} experience{experiences.length !== 1 ? 's' : ''} set up.
              Now you can:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 bg-white">
                <Link href="/dashboard/products/addons" className="flex flex-col items-center space-y-2">
                  <span>Create Add-ons</span>
                  <span className="text-xs text-blue-600">Add reusable items like socks, snacks, etc.</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 bg-white">
                <Link href="/dashboard/products/events" className="flex flex-col items-center space-y-2">
                  <span>Create Events</span>
                  <span className="text-xs text-blue-600">Add bookable sessions with dates and times</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}