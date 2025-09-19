'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Calendar, Clock, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'

interface Business {
  id: string
  name: string
  slug: string
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface Experience {
  id: string
  name: string
}

interface Event {
  id: string
  name: string
  experience: Experience
}

interface Session {
  id: string
  startTime: string
  endTime: string
  event: Event
}

interface Booking {
  id: string
  quantity: number
  total: number
  status: string
  guest: Guest
  session: Session
}

interface ConfirmationClientProps {
  business: Business
  booking: Booking
}

export function ConfirmationClient({
  business,
  booking
}: ConfirmationClientProps) {
  const handleAddToCalendar = () => {
    const startTime = new Date(booking.session.startTime)
    const endTime = new Date(booking.session.endTime)

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.session.event.name)}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${encodeURIComponent(`Booking confirmation: ${booking.id}`)}&location=${encodeURIComponent(business.name)}`

    window.open(calendarUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Success Header */}
        <div className="bg-green-600 p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-green-100">
            Your tickets have been successfully booked
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.session.event.name}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(booking.session.startTime), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(booking.session.startTime), 'h:mm a')} - {format(new Date(booking.session.endTime), 'h:mm a')}
                    </p>
                    <p className="text-sm text-gray-600">Duration: 1 hour</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Booking ID</span>
                    <span className="text-gray-900 font-mono">{booking.id}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tickets</span>
                    <span className="text-gray-900">{booking.quantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Total Paid</span>
                    <span className="text-gray-900">${(booking.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.guest.firstName} {booking.guest.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-900">{booking.guest.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-900">{booking.guest.phone || 'No phone provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Please arrive 15 minutes before your session time</li>
                <li>• Bring a valid ID for entry</li>
                <li>• Confirmation email has been sent to {booking.guest.email}</li>
                <li>• For any changes, contact us at least 24 hours in advance</li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleAddToCalendar}
              className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            >
              Add to Calendar
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 font-semibold"
              onClick={() => window.print()}
            >
              Print Confirmation
            </Button>
          </div>

          {/* Contact Information */}
          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact {business.name}</p>
            <p className="font-medium text-gray-900 mt-1">
              Booking ID: {booking.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}