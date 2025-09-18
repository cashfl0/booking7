'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'
import { AddOnsSection } from '@/components/dashboard/event-addons-section'

interface Event {
  id?: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  experienceId: string
  isActive: boolean
  sessions?: Array<{
    id: string
  }>
}

interface SessionTime {
  time: string
  id: string
}

interface EventFormProps {
  event?: Event
  experienceId: string
  onSubmit: (data: Omit<Event, 'id'> & { sessionTimes: SessionTime[], selectedDays: string[] }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function EventForm({ event, experienceId, onSubmit, onCancel, isLoading }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    startDate: event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
    experienceId: event?.experienceId || experienceId,
    isActive: event?.isActive ?? true
  })

  const [sessionTimes, setSessionTimes] = useState<SessionTime[]>([
    { id: '1', time: '14:30' }
  ])

  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday'])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (startDate >= endDate) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const description = formData.description.trim()
      await onSubmit({
        name: formData.name.trim(),
        description: description || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        experienceId: formData.experienceId,
        isActive: formData.isActive,
        sessionTimes,
        selectedDays
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter event name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your event"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>}
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>}
        </div>
      </div>

      {/* Session Scheduling */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Session Scheduling</h3>

        {/* Days of Week */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Days of the Week</Label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'monday', label: 'Mon' },
              { key: 'tuesday', label: 'Tue' },
              { key: 'wednesday', label: 'Wed' },
              { key: 'thursday', label: 'Thu' },
              { key: 'friday', label: 'Fri' },
              { key: 'saturday', label: 'Sat' },
              { key: 'sunday', label: 'Sun' }
            ].map((day) => (
              <label key={day.key} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDays([...selectedDays, day.key])
                    } else {
                      setSelectedDays(selectedDays.filter(d => d !== day.key))
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Session Times */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Session Times</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newId = (sessionTimes.length + 1).toString()
                setSessionTimes([...sessionTimes, { id: newId, time: '15:00' }])
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Time
            </Button>
          </div>

          <div className="space-y-2">
            {sessionTimes.map((sessionTime) => (
              <div key={sessionTime.id} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={sessionTime.time}
                  onChange={(e) => {
                    const updated = sessionTimes.map(st =>
                      st.id === sessionTime.id ? { ...st, time: e.target.value } : st
                    )
                    setSessionTimes(updated)
                  }}
                  className="flex-1"
                />
                {sessionTimes.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSessionTimes(sessionTimes.filter(st => st.id !== sessionTime.id))
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Sessions will be created for each selected day at these times within the event date range.
          </p>
        </div>
      </div>

      {/* Add-ons Selection */}
      {event?.id && (
        <AddOnsSection eventId={event.id} />
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
        />
        <Label htmlFor="isActive">Active (available for booking)</Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}