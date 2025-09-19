'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, ChevronRight, ChevronLeft } from 'lucide-react'
import { format, addDays, isSameDay, startOfDay, isToday } from 'date-fns'

interface Business {
  id: string
  name: string
  slug: string
}

interface Experience {
  id: string
  name: string
  slug: string
}

interface Event {
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

interface SessionSelectionClientProps {
  business: Business
  experience: Experience
  event: Event
  sessionsByDate: Record<string, Session[]>
}

export function SessionSelectionClient({
  business,
  experience,
  event,
  sessionsByDate
}: SessionSelectionClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const dates = Object.keys(sessionsByDate).map(dateString => new Date(dateString))
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())

  // Get visible dates for horizontal scroll (show 7 days starting from selected or today)
  const getVisibleDates = () => {
    const start = startOfDay(selectedDate)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const visibleDates = getVisibleDates()
  const selectedDateSessions = sessionsByDate[selectedDate.toDateString()] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white relative">
          <div className="flex items-center mb-4">
            <Link
              href={`/book/${business.slug}/${experience.slug}`}
              className="text-white hover:text-gray-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
            <p className="text-sm opacity-90">
              Select your preferred date and time
            </p>
          </div>
        </div>

        {/* Event Description */}
        {event.description && (
          <div className="p-6 border-b">
            <p className="text-gray-700 text-sm leading-relaxed">
              {event.description}
            </p>
            <button className="text-blue-600 text-sm font-medium mt-2">
              Read more
            </button>
          </div>
        )}

        {/* Date Selector */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select a date</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
              {visibleDates.map((date) => {
                const hasEvents = dates.some(d => isSameDay(d, date))
                const isSelected = isSameDay(date, selectedDate)

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    disabled={!hasEvents}
                    className={`
                      flex-shrink-0 px-4 py-3 rounded-lg text-center min-w-[80px] transition-colors
                      ${isSelected && hasEvents
                        ? 'bg-yellow-400 text-black font-semibold'
                        : hasEvents
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="text-xs">
                      {isToday(date) ? 'Today' : format(date, 'EEE')}
                    </div>
                    <div className="text-lg font-medium">
                      {format(date, 'd')}
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {sortedDates.length > 7 && (
            <p className="text-xs text-gray-500 text-center">
              {format(sortedDates[0], 'MMM d')} - {format(sortedDates[sortedDates.length - 1], 'MMM d')}
            </p>
          )}
        </div>

        {/* Time Slots */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a time</h2>

          {selectedDateSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No sessions available for {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {selectedDateSessions.slice(0, 6).map((session) => (
                  <Link
                    key={session.id}
                    href={`/book/${business.slug}/${experience.slug}/${event.slug}/${session.id}`}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-12 text-sm font-medium hover:bg-gray-50"
                    >
                      {format(new Date(session.startTime), 'h:mm a')}
                    </Button>
                  </Link>
                ))}
              </div>

              {selectedDateSessions.length > 6 && (
                <button className="text-blue-600 text-sm font-medium flex items-center">
                  Show more times
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}