'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { Session } from '../types/booking-types'

interface DateTimeSelectionProps {
  sessionsByDate: Record<string, Session[]>
  selectedDate: Date
  selectedSession: Session | null
  onDateChange: (date: Date) => void
  onSessionSelect: (session: Session) => void
  getAvailableCapacity: (session: Session) => number
}

export function DateTimeSelection({
  sessionsByDate,
  selectedDate,
  selectedSession,
  onDateChange,
  onSessionSelect,
  getAvailableCapacity
}: DateTimeSelectionProps) {
  const dates = Object.keys(sessionsByDate).map(dateString => new Date(dateString))
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
  const currentDateSessions = sessionsByDate[selectedDate.toDateString()] || []

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Select Date
        </h2>

        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentIndex = sortedDates.findIndex(date => isSameDay(date, selectedDate))
              if (currentIndex > 0) {
                onDateChange(sortedDates[currentIndex - 1])
              }
            }}
            disabled={sortedDates.findIndex(date => isSameDay(date, selectedDate)) === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="font-medium">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentIndex = sortedDates.findIndex(date => isSameDay(date, selectedDate))
              if (currentIndex < sortedDates.length - 1) {
                onDateChange(sortedDates[currentIndex + 1])
              }
            }}
            disabled={sortedDates.findIndex(date => isSameDay(date, selectedDate)) === sortedDates.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="font-medium mb-3">Available Times</h3>
          {currentDateSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sessions available for this date</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {currentDateSessions.map(session => {
                const availableCapacity = getAvailableCapacity(session)
                const isSelected = selectedSession?.id === session.id
                const isAvailable = availableCapacity > 0

                return (
                  <Button
                    key={session.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto p-3 ${!isAvailable ? 'opacity-50' : ''}`}
                    onClick={() => isAvailable && onSessionSelect(session)}
                    disabled={!isAvailable}
                  >
                    <div className="text-center">
                      <div className="font-medium">
                        {format(new Date(session.startTime), 'h:mm a')}
                      </div>
                      <div className="text-sm opacity-75">
                        {isAvailable ? `${availableCapacity} spots left` : 'Sold Out'}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}