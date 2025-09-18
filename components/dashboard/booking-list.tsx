'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar, User, Package, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { BookingDetailModal } from './booking-detail-modal'

interface BookingItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  itemType: 'SESSION' | 'ADD_ON'
  addOn?: {
    id: string
    name: string
    price: number
  } | null
}

interface Booking {
  id: string
  quantity: number
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  session: {
    id: string
    startTime: string
    endTime: string
    event: {
      id: string
      name: string
      experience: {
        id: string
        name: string
        slug: string
      }
    }
  }
  items: BookingItem[]
}

interface Experience {
  id: string
  name: string
  slug: string
}

interface Event {
  id: string
  name: string
  experienceId: string
}

interface BookingListProps {
  initialBookings: Booking[]
  experiences: Experience[]
  events: Event[]
  onBookingUpdate: (updatedBooking: Booking) => void
  autoOpenBookingId?: string | null
  onAutoOpenComplete?: () => void
}

export function BookingList({
  initialBookings,
  experiences,
  events,
  onBookingUpdate,
  autoOpenBookingId,
  onAutoOpenComplete
}: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    experienceId: '',
    eventId: '',
    status: ''
  })
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Update filtered events when experience filter changes
  useEffect(() => {
    if (filters.experienceId) {
      const experienceEvents = events.filter(event => event.experienceId === filters.experienceId)
      setFilteredEvents(experienceEvents)
      // Reset event filter if current selection is not valid for new experience
      if (filters.eventId && !experienceEvents.find(e => e.id === filters.eventId)) {
        setFilters(prev => ({ ...prev, eventId: '' }))
      }
    } else {
      setFilteredEvents(events)
    }
  }, [filters.experienceId, events, filters.eventId])

  // Auto-open booking if bookingId is provided
  useEffect(() => {
    if (autoOpenBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.id === autoOpenBookingId)
      if (booking) {
        setSelectedBooking(booking)
        onAutoOpenComplete?.()
      }
    }
  }, [autoOpenBookingId, bookings, onAutoOpenComplete])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.experienceId) params.set('experienceId', filters.experienceId)
      if (filters.eventId) params.set('eventId', filters.eventId)
      if (filters.status) params.set('status', filters.status)

      const response = await fetch(`/api/bookings?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      alert('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      experienceId: '',
      eventId: '',
      status: ''
    })
  }

  // Status color mapping (not currently used but kept for potential future use)
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'CONFIRMED':
  //       return 'default'
  //     case 'PENDING':
  //       return 'secondary'
  //     case 'COMPLETED':
  //       return 'default'
  //     case 'CANCELLED':
  //       return 'destructive'
  //     default:
  //       return 'secondary'
  //   }
  // }

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

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
  }

  const handleBookingUpdate = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(booking =>
      booking.id === updatedBooking.id ? updatedBooking : booking
    ))
    onBookingUpdate(updatedBooking)
    setSelectedBooking(null)
  }

  const handleModalClose = () => {
    setSelectedBooking(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <CardTitle>Filters</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="experienceFilter">Experience</Label>
                <Select
                  id="experienceFilter"
                  value={filters.experienceId}
                  onChange={(e) => handleFilterChange('experienceId', e.target.value)}
                >
                  <option value="">All Experiences</option>
                  {experiences.map((experience) => (
                    <option key={experience.id} value={experience.id}>
                      {experience.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="eventFilter">Event</Label>
                <Select
                  id="eventFilter"
                  value={filters.eventId}
                  onChange={(e) => handleFilterChange('eventId', e.target.value)}
                  disabled={!filters.experienceId}
                >
                  <option value="">All Events</option>
                  {filteredEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="statusFilter">Status</Label>
                <Select
                  id="statusFilter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={fetchBookings} disabled={loading}>
                  {loading ? 'Loading...' : 'Apply Filters'}
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some(f => f)
                ? 'No bookings match your current filters.'
                : 'No bookings have been created yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="p-6" onClick={() => handleBookingClick(booking)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Guest Info */}
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium">
                            {booking.guest.firstName} {booking.guest.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{booking.guest.email}</p>
                          {booking.guest.phone && (
                            <p className="text-sm text-gray-600">{booking.guest.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
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
                      </div>

                      {/* Booking Details */}
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium">{booking.quantity} ticket{booking.quantity !== 1 ? 's' : ''}</h4>
                          <p className="text-sm text-gray-600">
                            Total: ${booking.total.toFixed(2)}
                          </p>
                          {booking.items.filter(item => item.itemType === 'ADD_ON').length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">Add-ons:</p>
                              {booking.items
                                .filter(item => item.itemType === 'ADD_ON')
                                .map((item, index) => (
                                  <p key={index} className="text-xs text-gray-600">
                                    {item.quantity}x {item.addOn?.name} (${item.totalPrice.toFixed(2)})
                                  </p>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {bookings.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={handleModalClose}
          onUpdate={handleBookingUpdate}
        />
      )}
    </div>
  )
}