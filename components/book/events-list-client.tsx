'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, Users } from 'lucide-react'
import { useAnalytics } from '@/components/analytics/analytics-provider'

interface Business {
  id: string
  name: string
  slug: string
}

interface Experience {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface Session {
  id: string
  startTime: string
  endTime: string
}

interface Event {
  id: string
  name: string
  slug: string
  description?: string | null
  sessions: Session[]
  availableSessionsCount: number
}

interface EventsListClientProps {
  business: Business
  experience: Experience
  events: Event[]
}

export function EventsListClient({ business, experience, events }: EventsListClientProps) {
  const { trackEvent } = useAnalytics(business.slug)

  const handleEventClick = (event: Event) => {
    trackEvent({
      event_name: 'view_item',
      page_path: `/book/${business.slug}/${experience.slug}/${event.slug}`,
      items: [{
        item_id: event.id,
        item_name: event.name,
        item_category: experience.name
      }]
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          {experience.description && (
            <p className="text-gray-600 mt-2">{experience.description}</p>
          )}
        </div>

        {/* Alert Banner */}
        <div className="mx-6 mt-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-purple-800 font-medium text-sm">
                Spots sell out fast!
              </p>
              <p className="text-purple-700 text-sm">
                Secure your tickets now to guarantee entry!
              </p>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="p-6 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No events available
              </h3>
              <p className="text-gray-600">
                There are no upcoming events for this experience.
              </p>
            </div>
          ) : (
            events.map((event) => {
              const nextSession = event.sessions[0]

              return (
                <Link
                  key={event.id}
                  href={`/book/${business.slug}/${experience.slug}/${event.slug}`}
                  className="block"
                  onClick={() => handleEventClick(event)}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                          {event.name}
                        </h3>
                      </div>

                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{event.availableSessionsCount} session{event.availableSessionsCount !== 1 ? 's' : ''} available</span>
                        </div>
                        {nextSession && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Next: {new Date(nextSession.startTime).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-right">
                        <span className="text-blue-600 font-medium text-sm">
                          Select dates →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}