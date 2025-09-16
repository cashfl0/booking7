'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface CreateExperienceFormProps {
  businessId: string
}

export default function CreateExperienceForm({ businessId }: CreateExperienceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    sortOrder: 1
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create experience')
      }

      router.push('/dashboard/products/experiences')
      router.refresh()
    } catch (error) {
      console.error('Error creating experience:', error)
      // TODO: Add toast notification for errors
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/products/experiences">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <CardTitle>Experience Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Experience Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Bounce Time, Birthday Parties, Private Events"
              required
            />
            <p className="text-xs text-gray-500">
              Choose a clear, descriptive name for this experience category
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="bounce-time"
              required
            />
            <p className="text-xs text-gray-500">
              This will be used in URLs. It&apos;s automatically generated from the name but can be customized.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this experience category for your customers..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Optional description that will be shown to customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                min="1"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-gray-500">
                Controls the display order (lower numbers appear first)
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive">
                Active
              </Label>
              <p className="text-xs text-gray-500">
                Only active experiences are shown to customers
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Experience
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/products/experiences">
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}