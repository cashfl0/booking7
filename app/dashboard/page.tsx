import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Authentication is handled by middleware.ts
  // We only need session data for business logic
  const session = await getServerSession(authOptions)

  // Session is guaranteed to exist due to middleware protection
  if (!session) {
    console.error('Dashboard: No session found - middleware should prevent this')
    redirect('/auth/signin?error=session_expired')
  }

  // Validate business exists for this user
  if (!session.user.businessId) {
    console.error('Dashboard: User has no businessId', {
      userId: session.user.id,
      email: session.user.email
    })
    redirect('/auth/signin?error=no_business_access')
  }

  // Get basic stats for the dashboard
  let business
  try {
    console.log('Dashboard: Attempting to find business', {
      businessId: session.user.businessId,
      userId: session.user.id
    })

    business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      include: {
        experiences: {
          include: {
            events: {
              include: {
                sessions: {
                  include: {
                    bookings: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log('Dashboard: Business query result', {
      found: !!business,
      businessId: business?.id,
      businessName: business?.name
    })
  } catch (error) {
    console.error('Dashboard: Database error while finding business', {
      error: error instanceof Error ? error.message : 'Unknown error',
      businessId: session.user.businessId,
      userId: session.user.id
    })

    // Don't redirect on database errors - show an error page instead
    throw new Error('Database connection error. Please try again in a moment.')
  }

  if (!business) {
    console.error('Dashboard: Business not found for authenticated user', {
      userId: session.user.id,
      businessId: session.user.businessId,
      email: session.user.email
    })

    // Add a delay to prevent rapid redirect loops
    await new Promise(resolve => setTimeout(resolve, 1000))
    redirect('/auth/signin?error=business_not_found')
  }

  // Calculate stats
  const totalExperiences = business.experiences.length
  const totalEvents = business.experiences.reduce((sum, exp) => sum + exp.events.length, 0)
  const totalSessions = business.experiences.reduce((sum, exp) =>
    sum + exp.events.reduce((eventSum, event) => eventSum + event.sessions.length, 0), 0)
  const totalBookings = business.experiences.reduce((sum, exp) =>
    sum + exp.events.reduce((eventSum, event) =>
      eventSum + event.sessions.reduce((sessionSum, session) => sessionSum + session.bookings.length, 0), 0), 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
        <p className="text-gray-600">Welcome back, {session.user.name || session.user.email}</p>
        <div className="text-sm text-gray-500 mt-1">
          Role: {session.user.role}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Experiences</h3>
            <p className="text-3xl font-bold text-blue-600">{totalExperiences}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Events</h3>
            <p className="text-3xl font-bold text-green-600">{totalEvents}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Sessions</h3>
            <p className="text-3xl font-bold text-purple-600">{totalSessions}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Bookings</h3>
            <p className="text-3xl font-bold text-orange-600">{totalBookings}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Experiences</h2>
          </div>
          <div className="p-6">
            {business.experiences.length > 0 ? (
              <div className="space-y-4">
                {business.experiences.map((experience) => (
                  <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{experience.name}</h3>
                        <p className="text-gray-600 text-sm">{experience.description}</p>
                        <div className="mt-2 space-x-4 text-sm text-gray-500">
                          <span>Duration: {experience.duration} minutes</span>
                          <span>Max Capacity: {experience.maxCapacity}</span>
                          <span>Base Price: ${experience.basePrice.toString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {experience.events.length} event(s)
                        </div>
                        <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          experience.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {experience.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No experiences created yet. Start by creating your first experience!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}