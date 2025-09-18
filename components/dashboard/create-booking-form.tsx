'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, X } from 'lucide-react'

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  _count: {
    bookings: number
  }
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

interface Session {
  id: string
  startTime: string
  endTime: string
  maxCapacity?: number | null
  currentCount: number
  event: {
    id: string
    name: string
    maxCapacity?: number | null
    experience: {
      id: string
      name: string
      maxCapacity: number
    }
  }
}

interface AddOn {
  id: string
  name: string
  price: number
  description?: string | null
}

interface CreateBookingFormProps {
  experiences: Experience[]
  events: Event[]
  onSubmit: (bookingData: {
    sessionId: string
    guestId: string
    quantity: number
    addOnIds?: string[]
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CreateBookingForm({
  experiences,
  events,
  onSubmit,
  onCancel,
  isLoading = false
}: CreateBookingFormProps) {
  // Form state
  const [selectedExperienceId, setSelectedExperienceId] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([])

  // Data state
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [guests, setGuests] = useState<Guest[]>([])

  // UI state
  const [searchingGuests, setSearchingGuests] = useState(false)
  const [guestSearch, setGuestSearch] = useState('')
  const [showNewGuestForm, setShowNewGuestForm] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingAddOns, setLoadingAddOns] = useState(false)

  // New guest form
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Update filtered events when experience changes
  useEffect(() => {
    if (selectedExperienceId) {
      const experienceEvents = events.filter(event => event.experienceId === selectedExperienceId)
      setFilteredEvents(experienceEvents)
      if (selectedEventId && !experienceEvents.find(e => e.id === selectedEventId)) {
        setSelectedEventId('')
        setSelectedSessionId('')
        setSessions([])
        setAddOns([])
      }
    } else {
      setFilteredEvents([])
      setSelectedEventId('')
      setSelectedSessionId('')
      setSessions([])
      setAddOns([])
    }
  }, [selectedExperienceId, events, selectedEventId])

  // Fetch sessions when event changes
  useEffect(() => {
    if (selectedEventId) {
      fetchSessions()
      fetchEventAddOns()
    } else {
      setSessions([])
      setAddOns([])
      setSelectedSessionId('')
    }
  }, [selectedEventId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search guests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (guestSearch) {
        searchGuests()
      } else {
        setGuests([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [guestSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSessions = async () => {
    setLoadingSessions(true)
    try {
      const response = await fetch(`/api/sessions?eventId=${selectedEventId}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const fetchEventAddOns = async () => {
    setLoadingAddOns(true)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/addons`)
      if (response.ok) {
        const data = await response.json()
        setAddOns(data)
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error)
    } finally {
      setLoadingAddOns(false)
    }
  }

  const searchGuests = async () => {
    setSearchingGuests(true)
    try {
      const response = await fetch(`/api/guests?search=${encodeURIComponent(guestSearch)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setGuests(data)
      }
    } catch (error) {
      console.error('Error searching guests:', error)
    } finally {
      setSearchingGuests(false)
    }
  }

  const createNewGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.email) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      })

      if (response.ok) {
        const guest = await response.json()
        setSelectedGuestId(guest.id)
        setGuests([guest])
        setGuestSearch(`${guest.firstName} ${guest.lastName}`)
        setShowNewGuestForm(false)
        setNewGuest({ firstName: '', lastName: '', email: '', phone: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create guest')
      }
    } catch (error) {
      console.error('Error creating guest:', error)
      alert('Failed to create guest')
    }
  }

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOnIds(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    )
  }

  const calculateTotal = () => {
    const selectedSession = sessions.find(s => s.id === selectedSessionId)
    if (!selectedSession) return 0

    // Base price from experience (assuming we'd need to fetch this)
    // For now, we'll calculate from add-ons only
    const addOnTotal = selectedAddOnIds.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId)
      return total + (addOn ? addOn.price * quantity : 0)
    }, 0)

    return addOnTotal
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSessionId || !selectedGuestId || quantity < 1) {
      alert('Please fill in all required fields')
      return
    }

    const bookingData = {
      sessionId: selectedSessionId,
      guestId: selectedGuestId,
      quantity,
      addOnIds: selectedAddOnIds
    }

    await onSubmit(bookingData)
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId)
  const maxCapacity = selectedSession?.maxCapacity || selectedSession?.event.maxCapacity || selectedSession?.event.experience.maxCapacity || 0
  const availableSpots = maxCapacity - (selectedSession?.currentCount || 0)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Booking
        </CardTitle>
        <CardDescription>
          Create a manual booking for a guest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Experience & Event Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience">Experience *</Label>
              <Select
                id="experience"
                value={selectedExperienceId}
                onChange={(e) => setSelectedExperienceId(e.target.value)}
                required
              >
                <option value="">Select Experience</option>
                {experiences.map((experience) => (
                  <option key={experience.id} value={experience.id}>
                    {experience.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="event">Event *</Label>
              <Select
                id="event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={!selectedExperienceId}
                required
              >
                <option value="">Select Event</option>
                {filteredEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Session Selection */}
          <div>
            <Label htmlFor="session">Session *</Label>
            <Select
              id="session"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={!selectedEventId || loadingSessions}
              required
            >
              <option value="">
                {loadingSessions ? 'Loading sessions...' : 'Select Session'}
              </option>
              {sessions.map((session) => {
                const capacity = session.maxCapacity || session.event.maxCapacity || session.event.experience.maxCapacity
                const available = capacity - session.currentCount
                return (
                  <option key={session.id} value={session.id} disabled={available <= 0}>
                    {new Date(session.startTime).toLocaleDateString()} at{' '}
                    {new Date(session.startTime).toLocaleTimeString()} - {available} spots available
                  </option>
                )
              })}
            </Select>
          </div>

          {/* Guest Selection */}
          <div>
            <Label htmlFor="guestSearch">Guest *</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="guestSearch"
                  type="text"
                  placeholder="Search guests by name or email..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="pl-10"
                />
                {guestSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      setGuestSearch('')
                      setSelectedGuestId('')
                      setGuests([])
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {searchingGuests && (
                <p className="text-sm text-gray-500">Searching...</p>
              )}

              {guests.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {guests.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedGuestId === guest.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedGuestId(guest.id)
                        setGuestSearch(`${guest.firstName} ${guest.lastName}`)
                        setGuests([])
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{guest.firstName} {guest.lastName}</p>
                          <p className="text-sm text-gray-600">{guest.email}</p>
                          {guest.phone && (
                            <p className="text-sm text-gray-600">{guest.phone}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {guest._count.bookings} booking{guest._count.bookings !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {guestSearch && guests.length === 0 && !searchingGuests && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-2">No guests found</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewGuestForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create New Guest
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* New Guest Form */}
          {showNewGuestForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Create New Guest</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewGuestForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newFirstName">First Name *</Label>
                    <Input
                      id="newFirstName"
                      value={newGuest.firstName}
                      onChange={(e) => setNewGuest(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newLastName">Last Name *</Label>
                    <Input
                      id="newLastName"
                      value={newGuest.lastName}
                      onChange={(e) => setNewGuest(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newEmail">Email *</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPhone">Phone</Label>
                    <Input
                      id="newPhone"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNewGuestForm(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={createNewGuest}>
                    Create Guest
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availableSpots}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            {selectedSession && (
              <p className="text-sm text-gray-500 mt-1">
                {availableSpots} spot{availableSpots !== 1 ? 's' : ''} available
              </p>
            )}
          </div>

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div>
              <Label>Add-ons (Optional)</Label>
              {loadingAddOns ? (
                <p className="text-sm text-gray-500">Loading add-ons...</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {addOns.map((addOn) => (
                    <div key={addOn.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`addon-${addOn.id}`}
                        checked={selectedAddOnIds.includes(addOn.id)}
                        onChange={() => handleAddOnToggle(addOn.id)}
                      />
                      <Label htmlFor={`addon-${addOn.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{addOn.name}</span>
                            {addOn.description && (
                              <p className="text-sm text-gray-600">{addOn.description}</p>
                            )}
                          </div>
                          <span className="font-semibold">${addOn.price.toFixed(2)}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Total */}
          {selectedAddOnIds.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Add-ons Total:</span>
                <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}