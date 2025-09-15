import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Package, ShoppingCart } from 'lucide-react'

export default async function ProductsOverviewPage() {
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

  // Get counts for overview
  const [experienceCount, eventCount, addonCount] = await Promise.all([
    prisma.experience.count({
      where: { businessId: business.id, isActive: true }
    }),
    prisma.product.count({
      where: {
        experience: { businessId: business.id },
        isActive: true
      }
    }),
    prisma.addOn.count({
      where: {
        product: {
          experience: { businessId: business.id }
        },
        isActive: true
      }
    })
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Overview</h1>
          <p className="text-gray-600">Manage your experiences, events, and add-ons</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experiences</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{experienceCount}</div>
            <p className="text-xs text-muted-foreground">
              Active experience categories
            </p>
            <Button asChild className="mt-4 w-full" size="sm">
              <Link href="/dashboard/products/experiences">
                <Plus className="w-4 h-4 mr-2" />
                Manage Experiences
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventCount}</div>
            <p className="text-xs text-muted-foreground">
              Bookable events created
            </p>
            <Button asChild className="mt-4 w-full" size="sm">
              <Link href="/dashboard/products/events">
                <Plus className="w-4 h-4 mr-2" />
                Manage Events
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add-ons</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addonCount}</div>
            <p className="text-xs text-muted-foreground">
              Available add-on items
            </p>
            <Button asChild className="mt-4 w-full" size="sm">
              <Link href="/dashboard/products/addons">
                <Plus className="w-4 h-4 mr-2" />
                Manage Add-ons
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/products/experiences" className="flex flex-col items-center space-y-2">
                <Calendar className="w-6 h-6" />
                <span>Create Experience</span>
                <span className="text-xs text-muted-foreground">Set up a new experience category</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/products/events" className="flex flex-col items-center space-y-2">
                <Package className="w-6 h-6" />
                <span>Create Event</span>
                <span className="text-xs text-muted-foreground">Add bookable events with schedules</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/products/addons" className="flex flex-col items-center space-y-2">
                <ShoppingCart className="w-6 h-6" />
                <span>Create Add-on</span>
                <span className="text-xs text-muted-foreground">Add items customers can purchase</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {experienceCount === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p className="mb-4">
              Welcome! To start accepting bookings, you'll need to set up your products in this order:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Create <strong>Experiences</strong> (categories like "Bounce Time", "Birthday Parties")</li>
              <li>Create <strong>Add-ons</strong> (optional items like "Socks")</li>
              <li>Create <strong>Events</strong> (specific bookable sessions with dates, times, and pricing)</li>
            </ol>
            <Button asChild>
              <Link href="/dashboard/products/experiences">
                Start with Experiences
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}