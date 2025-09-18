'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddOnForm } from '@/components/dashboard/addon-form'
import Link from 'next/link'

interface AddOn {
  id: string
  name: string
  description: string | null
  price: number
  isActive: boolean
  sortOrder: number
  _count: {
    bookingItems: number
    events: number
  }
  events: Array<{
    event: {
      id: string
      name: string
      experience: {
        id: string
        name: string
      }
    }
  }>
}

export default function EditAddOnPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [addon, setAddon] = useState<AddOn | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAddon, setIsLoadingAddon] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [id, setId] = useState<string | null>(null)

  // Unwrap the params Promise
  useEffect(() => {
    params.then(resolvedParams => {
      setId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (!id) return

    const fetchAddon = async () => {
      try {
        const response = await fetch(`/api/addons/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch add-on')
        }
        const data = await response.json()
        setAddon(data)
      } catch (error) {
        console.error('Error fetching add-on:', error)
        alert('Failed to load add-on')
        router.push('/dashboard/experiences/add-ons')
      } finally {
        setIsLoadingAddon(false)
      }
    }

    fetchAddon()
  }, [id, router])

  const handleSubmit = async (data: {
    name: string
    description: string | null
    price: number
    isActive: boolean
    sortOrder: number
  }) => {
    if (!id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/addons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.details) {
          // Handle validation errors
          throw new Error(error.details.map((d: { message: string }) => d.message).join(', '))
        }
        throw new Error(error.error || 'Failed to update add-on')
      }

      router.push('/dashboard/experiences/add-ons')
    } catch (error) {
      console.error('Error updating add-on:', error)
      alert(error instanceof Error ? error.message : 'Failed to update add-on')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !addon) return

    if (!confirm(`Are you sure you want to delete "${addon.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/addons/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Failed to delete add-on')
      }

      router.push('/dashboard/experiences/add-ons')
    } catch (error) {
      console.error('Error deleting add-on:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete add-on')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/experiences/add-ons')
  }

  if (isLoadingAddon) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/experiences/add-ons">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Add-on</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!addon) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/experiences/add-ons">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add-on Not Found</h1>
            <p className="text-muted-foreground">The add-on you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    )
  }

  const hasBookings = addon._count.bookingItems > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/experiences/add-ons">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Add-on</h1>
            <p className="text-muted-foreground">
              Update &quot;{addon.name}&quot; - Used in {addon._count.events} event{addon._count.events !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {!hasBookings && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
      </div>

      {hasBookings && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            This add-on cannot be deleted because it has {addon._count.bookingItems} existing booking{addon._count.bookingItems !== 1 ? 's' : ''}.
            You can deactivate it instead to prevent it from being used in new bookings.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add-on Details</CardTitle>
          <CardDescription>
            Update the information for this global add-on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddOnForm
            addon={addon}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {addon.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Events</CardTitle>
            <CardDescription>
              This add-on is currently available for the following events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {addon.events.map((eventAddOn) => (
                <div key={eventAddOn.event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{eventAddOn.event.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {eventAddOn.event.experience.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}