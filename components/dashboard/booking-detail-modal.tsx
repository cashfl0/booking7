'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Edit3, Save, Calendar, User, Package, MapPin } from 'lucide-react'
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

interface BookingDetailModalProps {
  booking: Booking
  onClose: () => void
  onUpdate: (updatedBooking: Booking) => void
}

export function BookingDetailModal({ booking, onClose, onUpdate }: BookingDetailModalProps) {
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
      onUpdate(updatedBooking)
      setIsEditing(false)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Booking Details
                  <Badge variant={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  #{booking.id.slice(-8)} • Created {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Guest Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{booking.guest.firstName} {booking.guest.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{booking.guest.email}</p>
                </div>
                {booking.guest.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{booking.guest.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Guest ID</Label>
                  <p className="text-sm text-gray-500">#{booking.guest.id.slice(-8)}</p>
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Experience</Label>
                  <p className="text-sm">{booking.session.event.experience.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Event</Label>
                  <p className="text-sm">{booking.session.event.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">
                    {new Date(booking.session.startTime).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p className="text-sm">
                    {new Date(booking.session.startTime).toLocaleTimeString()} - {' '}
                    {new Date(booking.session.endTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Booking Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="text-sm mt-1">
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
                      <p className="text-sm mt-1">{booking.quantity} ticket{booking.quantity !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Items</Label>
                  <div className="space-y-2">
                    {sessionItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Session Tickets</p>
                          <p className="text-sm text-gray-600">{item.quantity}x at ${item.unitPrice.toFixed(2)} each</p>
                        </div>
                        <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                      </div>
                    ))}

                    {addonItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.addOn?.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity}x at ${item.unitPrice.toFixed(2)} each</p>
                        </div>
                        <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Total Amount</p>
                    <p className="text-lg font-bold">${booking.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Metadata
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Booking ID</Label>
                  <p className="font-mono">{booking.id}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Session ID</Label>
                  <p className="font-mono">{booking.session.id}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Created</Label>
                  <p>{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}