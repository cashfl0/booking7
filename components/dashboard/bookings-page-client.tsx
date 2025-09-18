'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { BookingList } from '@/components/dashboard/booking-list'
import { CreateBookingForm } from '@/components/dashboard/create-booking-form'

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

interface BookingsPageClientProps {
  initialBookings: Booking[]
  experiences: Experience[]
  events: Event[]
}

export function BookingsPageClient({
  initialBookings,
  experiences,
  events
}: BookingsPageClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateBooking = async (bookingData: {
    sessionId: string
    guestId: string
    quantity: number
    addOnIds?: string[]
  }) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create booking')
      }

      const newBooking = await response.json()

      // Transform the booking to match our interface
      const transformedBooking: Booking = {
        ...newBooking,
        createdAt: newBooking.createdAt,
        session: {
          ...newBooking.session,
          startTime: newBooking.session.startTime,
          endTime: newBooking.session.endTime
        }
      }

      // Add the new booking to the top of the list
      setBookings(prev => [transformedBooking, ...prev])
      setShowCreateForm(false)

      // Show success message
      alert('Booking created successfully!')
    } catch (error) {
      console.error('Error creating booking:', error)
      alert(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setShowCreateForm(false)
  }

  const handleBookingUpdate = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(booking =>
      booking.id === updatedBooking.id ? updatedBooking : booking
    ))
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Create Booking
            </h1>
            <p className="text-muted-foreground">
              Create a manual booking for a guest
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <CreateBookingForm
            experiences={experiences}
            events={events}
            onSubmit={handleCreateBooking}
            onCancel={handleCancel}
            isLoading={isCreating}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Bookings
          </h1>
          <p className="text-muted-foreground">
            Manage customer bookings and reservations
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Booking
        </Button>
      </div>

      <BookingList
        initialBookings={bookings}
        experiences={experiences}
        events={events}
        onBookingUpdate={handleBookingUpdate}
      />
    </div>
  )
}