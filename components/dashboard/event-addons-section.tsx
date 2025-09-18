'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, X } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface AddOn {
  id: string
  name: string
  description: string | null
  price: number
  isActive: boolean
  sortOrder: number
  _count: {
    bookingItems: number
  }
}

interface EventAddOnsProps {
  eventId: string
}

export function AddOnsSection({ eventId }: EventAddOnsProps) {
  const [eventAddOns, setEventAddOns] = useState<AddOn[]>([])
  const [allAddOns, setAllAddOns] = useState<AddOn[]>([])
  const [selectedAddOnId, setSelectedAddOnId] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchData()
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch both event add-ons and all available add-ons
      const [eventAddOnsResponse, allAddOnsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}/addons`),
        fetch('/api/addons')
      ])

      if (eventAddOnsResponse.ok) {
        const eventAddOnsData = await eventAddOnsResponse.json()
        setEventAddOns(eventAddOnsData)
      }

      if (allAddOnsResponse.ok) {
        const allAddOnsData = await allAddOnsResponse.json()
        setAllAddOns(allAddOnsData)
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddOn = async () => {
    if (!selectedAddOnId) return

    setAdding(true)
    try {
      const response = await fetch(`/api/events/${eventId}/addons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addOnId: selectedAddOnId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add add-on')
      }

      const newAddOn = await response.json()
      setEventAddOns([...eventAddOns, newAddOn])
      setSelectedAddOnId('')
    } catch (error) {
      console.error('Error adding add-on:', error)
      alert(error instanceof Error ? error.message : 'Failed to add add-on')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAddOn = async (addOnId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/addons/${addOnId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Failed to remove add-on')
      }

      setEventAddOns(eventAddOns.filter(addon => addon.id !== addOnId))
    } catch (error) {
      console.error('Error removing add-on:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove add-on')
    }
  }

  // Filter out add-ons that are already associated with this event
  const availableAddOns = allAddOns.filter(
    addon => !eventAddOns.some(eventAddon => eventAddon.id === addon.id)
  )

  if (loading) {
    return (
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Add-ons for this Event
        </h3>
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Add-ons for this Event
        </h3>
      </div>

      {/* Add new add-on */}
      {availableAddOns.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <Label htmlFor="addOnSelect" className="text-sm font-medium mb-2 block">
            Add an existing add-on to this event
          </Label>
          <div className="flex gap-2">
            <Select
              id="addOnSelect"
              value={selectedAddOnId}
              onChange={(e) => setSelectedAddOnId(e.target.value)}
              className="flex-1"
            >
              <option value="">Select an add-on...</option>
              {availableAddOns.map((addon) => (
                <option key={addon.id} value={addon.id}>
                  {addon.name} - ${addon.price.toFixed(2)}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              onClick={handleAddAddOn}
              disabled={!selectedAddOnId || adding}
              size="sm"
            >
              {adding ? (
                <>Adding...</>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Current event add-ons */}
      {eventAddOns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No add-ons associated with this event yet</p>
            {availableAddOns.length === 0 && (
              <p className="text-sm text-gray-500">
                Create some add-ons first, then you can associate them with events.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventAddOns.map((addon) => {
            const hasBookings = addon._count.bookingItems > 0
            return (
              <Card key={addon.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{addon.name}</h4>
                      {addon.description && (
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      )}
                    </div>
                    <Badge variant={addon.isActive ? 'default' : 'secondary'}>
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${addon.price.toFixed(2)}</span>
                    {hasBookings ? (
                      <Badge variant="outline" className="text-orange-600">
                        {addon._count.bookingItems} booking{addon._count.bookingItems !== 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveAddOn(addon.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-sm text-gray-500 mt-3">
        Add-ons are optional services customers can purchase with this event.
        You can only remove add-ons that don&apos;t have existing bookings.
      </p>
    </div>
  )
}