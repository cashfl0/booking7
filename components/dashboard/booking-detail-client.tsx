'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit3, Save, Calendar, User, Package, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface BookingDetailClientProps {
  booking: Booking
}

export function BookingDetailClient({ booking: initialBooking }: BookingDetailClientProps) {
  const router = useRouter()
  const [booking, setBooking] = useState(initialBooking)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editedBooking, setEditedBooking] = useState({
    status: booking.status,
    quantity: booking.quantity
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'COMPLETED':
        return 'outline'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedBooking),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update booking')
      }

      const updatedBooking = await response.json()
      setBooking(updatedBooking)
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating booking:', error)
      alert(error instanceof Error ? error.message : 'Failed to update booking')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setEditedBooking({
      status: booking.status,
      quantity: booking.quantity
    })
    setIsEditing(false)
  }

  const sessionItems = booking.items.filter(item => item.itemType === 'SESSION')
  const addonItems = booking.items.filter(item => item.itemType === 'ADD_ON')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                  Booking #{booking.id.slice(-8)}
                </CardTitle>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Booking
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <p className="text-lg font-medium">{booking.guest.firstName} {booking.guest.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <p className="text-lg">{booking.guest.email}</p>
              </div>
              {booking.guest.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                  <p className="text-lg">{booking.guest.phone}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Guest ID</Label>
                <p className="text-lg font-mono">#{booking.guest.id.slice(-8)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Experience</Label>
                <p className="text-lg font-medium">{booking.session.event.experience.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Event</Label>
                <p className="text-lg">{booking.session.event.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                <p className="text-lg">
                  {new Date(booking.session.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Time</Label>
                <p className="text-lg">
                  {new Date(booking.session.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })} - {new Date(booking.session.endTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <Select
                  id="status"
                  value={editedBooking.status}
                  onChange={(e) => setEditedBooking(prev => ({ ...prev, status: e.target.value as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              ) : (
                <div className="mt-1">
                  <Badge variant={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              {isEditing ? (
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={editedBooking.quantity}
                  onChange={(e) => setEditedBooking(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              ) : (
                <p className="mt-1 text-lg">{booking.quantity} ticket{booking.quantity !== 1 ? 's' : ''}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Session Tickets</p>
                    <p className="text-sm text-muted-foreground">{item.quantity}x at ${item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                </div>
              ))}

              {addonItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.addOn?.name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity}x at ${item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                </div>
              ))}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-xl font-bold">${booking.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Booking ID</Label>
              <p className="font-mono text-sm">{booking.id}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Session ID</Label>
              <p className="font-mono text-sm">{booking.session.id}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Created At</Label>
              <p className="text-sm">{new Date(booking.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}