'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Calendar, Clock, MapPin, Mail, Download } from 'lucide-react'
import Link from 'next/link'

interface ConfirmationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  zipCode: string
  subscribeToEmails: boolean
  acceptTerms: boolean
  cart: {
    productId: string
    sessionId: string
    tickets: Record<string, number>
    addOns: Record<string, number>
    total: number
  }
  bookingNumber: string
  createdAt: string
  paymentMethod: string
  paymentConfirmed: boolean
  confirmationNumber: string
  paidAt: string
}

interface ConfirmationClientProps {
  businessSlug: string
}

export default function ConfirmationClient({ businessSlug }: ConfirmationClientProps) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null)

  useEffect(() => {
    // Load confirmation from localStorage
    const confirmationData = localStorage.getItem('confirmation')
    if (confirmationData) {
      setConfirmation(JSON.parse(confirmationData))
    } else {
      // Redirect back if no confirmation data
      router.push(`/${businessSlug}`)
    }
  }, [businessSlug, router])

  const handleNewBooking = () => {
    // Clear confirmation data
    localStorage.removeItem('confirmation')
    router.push(`/${businessSlug}`)
  }

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No confirmation found</h2>
          <p className="text-gray-600 mb-4">Please start a new booking.</p>
          <Button asChild>
            <Link href={`/${businessSlug}`}>
              Start Booking
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking confirmed!</h1>
          <p className="text-lg text-gray-600">
            Your tickets have been booked and payment has been processed.
          </p>
        </div>

        {/* Confirmation Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking number:</span>
                    <span className="font-medium">{confirmation.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmation:</span>
                    <span className="font-medium">{confirmation.confirmationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total paid:</span>
                    <span className="font-medium">${confirmation.cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment method:</span>
                    <span className="font-medium capitalize">{confirmation.paymentMethod.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{confirmation.firstName} {confirmation.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{confirmation.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{confirmation.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">Today</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">2:00 PM - 3:30 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">Funbox Indoor</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important information</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Email confirmation sent</p>
                  <p>A confirmation email has been sent to {confirmation.email} with your tickets and waiver.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Arrive 15 minutes early</p>
                  <p>Please arrive 15 minutes before your session time to check in and complete any required waivers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Download the Funbox app</p>
                  <p>Get the mobile app for easy check-in and exclusive offers.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleNewBooking}
            className="px-8"
          >
            Book another session
          </Button>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8"
          >
            Download tickets
          </Button>
        </div>

        {/* Support */}
        <div className="text-center mt-8 pt-8 border-t">
          <p className="text-gray-600 text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@funbox.com" className="text-blue-600 hover:underline">
              support@funbox.com
            </a>{' '}
            or call{' '}
            <a href="tel:+1234567890" className="text-blue-600 hover:underline">
              (123) 456-7890
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}