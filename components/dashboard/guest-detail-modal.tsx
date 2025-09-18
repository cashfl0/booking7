'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Users, Mail, Phone, Calendar, Package, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SimpleBooking {
  id: string
  quantity: number
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  session: {
    startTime: string
    event: {
      name: string
      experience: {
        name: string
      }
    }
  }
  items: Array<{
    itemType: 'SESSION' | 'ADD_ON'
    addOn?: {
      name: string
    } | null
  }>
}

interface GuestDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  _count: {
    bookings: number
  }
  bookings?: Array<{
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    total: number
    session: {
      event: {
        name: string
        experience: {
          name: string
        }
      }
    }
  }>
}

interface GuestDetailModalProps {
  guest: GuestDetail
  onClose: () => void
}

export function GuestDetailModal({ guest, onClose }: GuestDetailModalProps) {
  const router = useRouter()
  const [allBookings, setAllBookings] = useState<SimpleBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllBookings()
  }, [guest.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllBookings = async () => {
    try {
      const response = await fetch(`/api/guests/${guest.id}/bookings`)
      if (!response.ok) {
        throw new Error('Failed to fetch guest bookings')
      }
      const bookings = await response.json()
      setAllBookings(bookings)
    } catch (error) {
      console.error('Error fetching guest bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CANCELLED':
        return 'destructive'
      case 'COMPLETED':
        return 'outline'
      default:
        return 'default'
    }
  }

  const handleBookingClick = (booking: SimpleBooking) => {
    // Close the guest modal and navigate to bookings page with the booking selected
    onClose()
    // Navigate to bookings page - the booking detail modal will be triggered by the bookings page
    router.push(`/dashboard/bookings?bookingId=${booking.id}`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Guest Details
                </CardTitle>
                <CardDescription>
                  #{guest.id.slice(-8)} • Member since {formatDistanceToNow(new Date(guest.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Guest Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold">{guest.firstName} {guest.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {guest.email}
                  </p>
                </div>
                {guest.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {guest.phone}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Bookings</label>
                  <p className="text-sm">{guest._count.bookings} booking{guest._count.bookings !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* All Bookings */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Booking History
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading bookings...</p>
                </div>
              ) : allBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings found for this guest.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusVariant(booking.status)}>
                              {booking.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              #{booking.id.slice(-8)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">{booking.session.event.name}</h4>
                              <p className="text-sm text-gray-600">
                                {booking.session.event.experience.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.session.startTime).toLocaleDateString()} at{' '}
                                {new Date(booking.session.startTime).toLocaleTimeString()}
                              </p>
                            </div>

                            <div>
                              <p className="font-medium flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {booking.quantity} ticket{booking.quantity !== 1 ? 's' : ''}
                              </p>
                              <p className="text-sm text-gray-600">
                                Total: ${booking.total.toFixed(2)}
                              </p>
                              {booking.items.filter(item => item.itemType === 'ADD_ON').length > 0 && (
                                <p className="text-xs text-gray-500">
                                  + {booking.items.filter(item => item.itemType === 'ADD_ON').length} add-on{booking.items.filter(item => item.itemType === 'ADD_ON').length !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}