'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { EventForm } from '@/components/dashboard/event-form'

interface Experience {
  id: string
  name: string
  slug: string
}

interface Event {
  id: string
  name: string
  description: string | null
  basePrice: number
  startDate: string
  endDate: string
  experienceId: string
  isActive: boolean
  sessions: Array<{ id: string }>
}

export default function EventsPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch all experiences for dropdown
  const fetchExperiences = async () => {
    try {
      const response = await fetch('/api/experiences')
      if (response.ok) {
        const data = await response.json()
        setExperiences(data)
        // Auto-select first experience if available
        if (data.length > 0 && !selectedExperienceId) {
          setSelectedExperienceId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching experiences:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch events for selected experience
  const fetchEvents = async (experienceId: string) => {
    if (!experienceId) {
      setEvents([])
      return
    }

    setEventsLoading(true)
    try {
      const response = await fetch(`/api/events?experienceId=${experienceId}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  useEffect(() => {
    fetchExperiences()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedExperienceId) {
      fetchEvents(selectedExperienceId)
    }
  }, [selectedExperienceId])

  const handleCreateEvent = async (data: Omit<Event, 'id' | 'sessions'> & { sessionTimes: { id: string, time: string }[], selectedDays: string[] }) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchEvents(selectedExperienceId)
        setShowCreateForm(false)
      } else {
        const error = await response.json()
        console.error('Error creating event:', error)

        let errorMessage = error.error || 'Unknown error'
        if (error.details && Array.isArray(error.details)) {
          const validationErrors = error.details.map((detail: { path?: string[]; message: string }) =>
            `${detail.path?.join('.')}: ${detail.message}`
          ).join('\n')
          errorMessage = `Validation error:\n${validationErrors}`
        }

        alert(`Error creating event:\n${errorMessage}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditEvent = async (data: Omit<Event, 'id' | 'sessions'> & { sessionTimes: { id: string, time: string }[], selectedDays: string[] }) => {
    if (!editingEvent) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchEvents(selectedExperienceId)
        setEditingEvent(null)
      } else {
        const error = await response.json()
        console.error('Error updating event:', error)

        let errorMessage = error.error || 'Unknown error'
        if (error.details && Array.isArray(error.details)) {
          const validationErrors = error.details.map((detail: { path?: string[]; message: string }) =>
            `${detail.path?.join('.')}: ${detail.message}`
          ).join('\n')
          errorMessage = `Validation error:\n${validationErrors}`
        }

        alert(`Error updating event:\n${errorMessage}`)
      }
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEvents(selectedExperienceId)
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Error deleting event')
    }
  }

  const selectedExperience = experiences.find(exp => exp.id === selectedExperienceId)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-96 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Create and manage events for your experiences</p>
        </div>
        {selectedExperienceId && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Experience Selection */}
      <div className="mb-8">
        <Label htmlFor="experience-select" className="text-sm font-medium mb-2 block">
          Select Experience
        </Label>
        {experiences.length === 0 ? (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-600">
              No experiences found. <span className="text-blue-600 hover:underline cursor-pointer">Create an experience first</span> to add events.
            </p>
          </div>
        ) : (
          <Select
            id="experience-select"
            value={selectedExperienceId}
            onChange={(e) => setSelectedExperienceId(e.target.value)}
            className="max-w-md"
          >
            <option value="">Select an experience...</option>
            {experiences.map((experience) => (
              <option key={experience.id} value={experience.id}>
                {experience.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Events List */}
      {selectedExperienceId && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold">Events for &quot;{selectedExperience?.name}&quot;</h2>
            {eventsLoading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          {eventsLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-6">Create your first event for this experience</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => {
                const startDate = new Date(event.startDate)
                const endDate = new Date(event.endDate)
                const totalSessions = event.sessions.length

                return (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {event.name}
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              event.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {event.description || 'No description provided'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEvent(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Base Price</p>
                          <p className="font-semibold">${Number(event.basePrice).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-semibold">{startDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="font-semibold">{endDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sessions</p>
                          <p className="font-semibold">{totalSessions} scheduled</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </h2>
            <EventForm
              event={editingEvent || undefined}
              experienceId={selectedExperienceId}
              onSubmit={editingEvent ? handleEditEvent : handleCreateEvent}
              onCancel={() => {
                setShowCreateForm(false)
                setEditingEvent(null)
              }}
              isLoading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  )
}