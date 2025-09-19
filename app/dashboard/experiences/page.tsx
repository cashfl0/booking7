'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Star, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExperienceForm } from '@/components/dashboard/experience-form'

interface Experience {
  id: string
  name: string
  slug: string
  description: string | null
  duration: number
  maxCapacity: number
  isActive: boolean
  sortOrder: number
  business: {
    slug: string
  }
  events: Array<{
    id: string
    sessions: Array<{ id: string }>
  }>
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const copyBookingUrl = async (experience: Experience) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const bookingUrl = `${baseUrl}/book/${experience.business.slug}/${experience.slug}`

    try {
      await navigator.clipboard.writeText(bookingUrl)
      alert('Booking URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      alert('Failed to copy URL')
    }
  }

  const openBookingUrl = (experience: Experience) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const bookingUrl = `${baseUrl}/book/${experience.business.slug}/${experience.slug}`
    window.open(bookingUrl, '_blank')
  }

  const fetchExperiences = async () => {
    try {
      const response = await fetch('/api/experiences')
      if (response.ok) {
        const data = await response.json()
        setExperiences(data)
      }
    } catch (error) {
      console.error('Error fetching experiences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExperience = async (data: Omit<Experience, 'id' | 'slug' | 'sortOrder' | 'events' | 'business'>) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchExperiences()
        setShowCreateForm(false)
      } else {
        const error = await response.json()
        console.error('Error creating experience:', error)
      }
    } catch (error) {
      console.error('Error creating experience:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditExperience = async (data: Omit<Experience, 'id' | 'slug' | 'sortOrder' | 'events' | 'business'>) => {
    if (!editingExperience) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/experiences/${editingExperience.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchExperiences()
        setEditingExperience(null)
      } else {
        const error = await response.json()
        console.error('Error updating experience:', error)
      }
    } catch (error) {
      console.error('Error updating experience:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return

    try {
      const response = await fetch(`/api/experiences/${experienceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchExperiences()
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting experience')
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
      alert('Error deleting experience')
    }
  }

  useEffect(() => {
    fetchExperiences()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Experiences</h1>
          <p className="text-gray-600">Manage your experiences and offerings</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Experience
        </Button>
      </div>

      {/* Experiences List */}
      {experiences.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No experiences yet</h3>
            <p className="text-gray-600 mb-6">Create your first experience to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Experience
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {experiences.map((experience) => {
            const totalSessions = experience.events.reduce(
              (sum, event) => sum + event.sessions.length,
              0
            )

            return (
              <Card key={experience.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {experience.name}
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          experience.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {experience.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {experience.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingExperience(experience)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExperience(experience.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold">{experience.duration} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Capacity</p>
                      <p className="font-semibold">{experience.maxCapacity} people</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sessions</p>
                      <p className="font-semibold">{totalSessions} scheduled</p>
                    </div>
                  </div>

                  {/* Booking URL Section */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">Booking URL</p>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                      <code className="flex-1 text-sm text-gray-700 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/book/{experience.business.slug}/{experience.slug}
                      </code>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyBookingUrl(experience)}
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBookingUrl(experience)}
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingExperience) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingExperience ? 'Edit Experience' : 'Create Experience'}
            </h2>
            <ExperienceForm
              experience={editingExperience || undefined}
              onSubmit={editingExperience ? handleEditExperience : handleCreateExperience}
              onCancel={() => {
                setShowCreateForm(false)
                setEditingExperience(null)
              }}
              isLoading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  )
}