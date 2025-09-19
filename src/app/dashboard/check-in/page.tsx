'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, User, Calendar, Clock, MapPin, AlertCircle, Loader } from 'lucide-react'
import { format } from 'date-fns'

interface BookingData {
  booking: {
    id: string
    status: string
    checkedIn: boolean
    checkInTime: string | null
    quantity: number
    total: number
    createdAt: string
  }
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  session: {
    id: string
    startTime: string
    endTime: string
    currentCount: number
    maxCapacity: number | null
  }
  event: {
    id: string
    name: string
    description: string | null
  }
  experience: {
    id: string
    name: string
  }
  business: {
    id: string
    name: string
    slug: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    itemType: string
    addOn: {
      id: string
      name: string
      description: string | null
    } | null
  }>
}

export default function CheckInPage() {
  const searchParams = useSearchParams()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInSuccess, setCheckInSuccess] = useState(false)

  useEffect(() => {
    const data = searchParams.get('data')
    if (data) {
      fetchBookingData(data)
    } else {
      setError('No QR code data provided')
      setLoading(false)
    }
  }, [searchParams])

  const fetchBookingData = async (qrData: string) => {
    try {
      const response = await fetch(`/api/dashboard/check-in?data=${encodeURIComponent(qrData)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch booking data')
      }

      const data = await response.json()
      setBookingData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking data')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!bookingData || checkingIn) return

    setCheckingIn(true)
    try {
      const response = await fetch('/api/dashboard/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.booking.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check in')
      }

      const result = await response.json()

      // Update local state
      setBookingData(prev => prev ? {
        ...prev,
        booking: {
          ...prev.booking,
          checkedIn: true,
          checkInTime: new Date().toISOString()
        }
      } : null)

      setCheckInSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in')
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data</h2>
            <p className="text-gray-600">No booking data found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { booking, guest, session, event, experience, business, items } = bookingData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
          <p className="text-lg text-gray-600">Guest Check-In</p>
        </div>

        {/* Check-in Status */}
        {checkInSuccess && (
          <div className="mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-green-800 font-medium">
                    {guest.firstName} {guest.lastName} has been successfully checked in!
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {guest.firstName} {guest.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {guest.email}
              </div>
              {guest.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {guest.phone}
                </div>
              )}
              <div>
                <span className="font-medium">Tickets:</span> {booking.quantity}
              </div>
              <div>
                <span className="font-medium">Total Paid:</span> ${Number(booking.total).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          {/* Session Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Experience:</span> {experience.name}
              </div>
              <div>
                <span className="font-medium">Event:</span> {event.name}
              </div>
              <div>
                <span className="font-medium">Date:</span> {format(new Date(session.startTime), 'EEEE, MMMM d, yyyy')}
              </div>
              <div>
                <span className="font-medium">Time:</span> {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
              </div>
              <div>
                <span className="font-medium">Capacity:</span> {session.currentCount}/{session.maxCapacity || 'Unlimited'}
              </div>
            </CardContent>
          </Card>

          {/* Check-in Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Check-In Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.checkedIn ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Already Checked In</h3>
                  <p className="text-gray-600">
                    Checked in on {format(new Date(booking.checkInTime!), 'EEEE, MMMM d, yyyy')} at {format(new Date(booking.checkInTime!), 'h:mm a')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Check In</h3>
                  <Button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    size="lg"
                    className="px-8"
                  >
                    {checkingIn ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      'Check In Guest'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons (if any) */}
          {items.some(item => item.addOn) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Add-ons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.filter(item => item.addOn).map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <span className="font-medium">{item.addOn!.name}</span>
                        {item.addOn!.description && (
                          <p className="text-sm text-gray-600">{item.addOn!.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${Number(item.totalPrice).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}