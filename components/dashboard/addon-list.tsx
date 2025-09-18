'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Edit, Trash2 } from 'lucide-react'
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
}

interface AddOnListProps {
  initialAddons: AddOn[]
}

function AddOnCard({ addon, onDelete }: { addon: AddOn, onDelete: (id: string) => void }) {
  const hasBookings = addon._count.bookingItems > 0

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${addon.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/addons/${addon.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Failed to delete add-on')
      }

      onDelete(addon.id)
    } catch (error) {
      console.error('Error deleting add-on:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete add-on')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">{addon.name}</CardTitle>
          <CardDescription>
            {addon.description || 'No description provided'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={addon.isActive ? 'default' : 'secondary'}>
            {addon.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="font-semibold text-lg">${addon.price.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              Used in {addon._count.events} event{addon._count.events !== 1 ? 's' : ''}
            </div>
            {hasBookings && (
              <div className="text-orange-600">
                {addon._count.bookingItems} booking{addon._count.bookingItems !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href={`/dashboard/experiences/add-ons/${addon.id}/edit`}>
                <Edit className="w-4 h-4" />
              </Link>
            </Button>
            {!hasBookings && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AddOnList({ initialAddons }: AddOnListProps) {
  const [addons, setAddons] = useState(initialAddons)

  const handleDelete = (deletedId: string) => {
    setAddons(addons.filter(addon => addon.id !== deletedId))
  }

  return (
    <>
      {addons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No add-ons yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first add-on to enhance your events with additional services.
            </p>
            <Button asChild>
              <Link href="/dashboard/experiences/add-ons/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Add-on
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addons.map((addon) => (
            <AddOnCard key={addon.id} addon={addon} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  )
}