import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Calendar, Clock, Users } from 'lucide-react'

export default async function EventsPage() {
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

  // Get all sessions (events) for this business
  const events = await prisma.session_Product.findMany({
    where: {
      product: {
        experience: { businessId: business.id }
      }
    },
    include: {
      product: {
        select: {
          name: true,
          basePrice: true,
          experience: {
            select: { name: true }
          }
        }
      },
      _count: {
        select: {
          bookings: { where: { status: { not: 'CANCELLED' } } }
        }
      }
    },
    orderBy: [
      { startTime: 'asc' }
    ]
  })

  // Get prerequisites counts for the getting started guide
  const [experienceCount, addOnCount] = await Promise.all([
    prisma.experience.count({
      where: { businessId: business.id, isActive: true }
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

  const now = new Date()
  const upcomingEvents = events.filter(event => event.startTime >= now)
  const pastEvents = events.filter(event => event.startTime < now)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Manage your bookable sessions with specific dates and times</p>
        </div>
        {experienceCount > 0 ? (
          <Button asChild>
            <Link href="/dashboard/products/events/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Prerequisites Warning */}
      {experienceCount === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Create Experiences First</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-800">
            <p className="mb-4">
              You need to create at least one experience category before you can create events.
              Events are specific bookable sessions within experiences.
            </p>
            <Button asChild>
              <Link href="/dashboard/products/experiences">
                Create Your First Experience
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {experienceCount > 0 && (
        <>
          {events.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 text-center mb-4 max-w-sm">
                  Create your first bookable event with specific dates, times, and pricing.
                </p>
                <Button asChild>
                  <Link href="/dashboard/products/events/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Upcoming Events ({upcomingEvents.length})
                  </h2>
                  <div className="grid gap-4">
                    {upcomingEvents.map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {event.product.name}
                                </h3>
                                <Badge variant={event.isActive ? "default" : "secondary"}>
                                  {event.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">
                                  ${event.product.basePrice.toFixed(2)}
                                </Badge>
                              </div>

                              <p className="text-gray-600 mb-3">
                                {event.product.experience.name}
                              </p>

                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(event.startTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    {event._count.bookings}/{event.maxCapacity} booked
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/products/events/${event.id}/edit`}>
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
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Past Events ({pastEvents.length})
                  </h2>
                  <div className="grid gap-4">
                    {pastEvents.slice(0, 5).map((event) => (
                      <Card key={event.id} className="opacity-75">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {event.product.name}
                                </h3>
                                <Badge variant="secondary">Completed</Badge>
                                <Badge variant="outline">
                                  ${event.product.basePrice.toFixed(2)}
                                </Badge>
                              </div>

                              <p className="text-gray-600 mb-3">
                                {event.product.experience.name}
                              </p>

                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(event.startTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    {event._count.bookings}/{event.maxCapacity} attended
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/products/events/${event.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pastEvents.length > 5 && (
                      <p className="text-center text-gray-500 py-4">
                        ... and {pastEvents.length - 5} more past events
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Getting Started Guide */}
              {events.length > 0 && addOnCount === 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Enhance Your Events</CardTitle>
                  </CardHeader>
                  <CardContent className="text-blue-800">
                    <p className="mb-4">
                      Great! You have {events.length} event{events.length !== 1 ? 's' : ''} set up.
                      Consider adding add-ons to increase revenue per booking.
                    </p>
                    <Button asChild variant="outline" className="bg-white">
                      <Link href="/dashboard/products/addons">
                        Create Add-ons
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}