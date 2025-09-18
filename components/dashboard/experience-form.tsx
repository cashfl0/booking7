'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Experience {
  id?: string
  name: string
  description: string | null
  basePrice: number
  duration: number
  maxCapacity: number
  isActive: boolean
}

interface ExperienceFormProps {
  experience?: Experience
  onSubmit: (data: Omit<Experience, 'id'>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ExperienceForm({ experience, onSubmit, onCancel, isLoading }: ExperienceFormProps) {
  const [formData, setFormData] = useState({
    name: experience?.name || '',
    description: experience?.description || '',
    basePrice: experience?.basePrice || 0,
    duration: experience?.duration || 60,
    maxCapacity: experience?.maxCapacity || 10,
    isActive: experience?.isActive ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (formData.basePrice < 0) {
      newErrors.basePrice = 'Price must be positive'
    }
    if (formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute'
    }
    if (formData.maxCapacity < 1) {
      newErrors.maxCapacity = 'Capacity must be at least 1'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        basePrice: Number(formData.basePrice),
        duration: Number(formData.duration),
        maxCapacity: Number(formData.maxCapacity),
        isActive: formData.isActive
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Experience Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter experience name"
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
          placeholder="Describe your experience"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="basePrice">Base Price ($)</Label>
          <Input
            id="basePrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            className={errors.basePrice ? 'border-red-500' : ''}
          />
          {errors.basePrice && <p className="text-sm text-red-500 mt-1">{errors.basePrice}</p>}
        </div>

        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
            className={errors.duration ? 'border-red-500' : ''}
          />
          {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="maxCapacity">Maximum Capacity</Label>
        <Input
          id="maxCapacity"
          type="number"
          min="1"
          value={formData.maxCapacity}
          onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
          className={errors.maxCapacity ? 'border-red-500' : ''}
        />
        {errors.maxCapacity && <p className="text-sm text-red-500 mt-1">{errors.maxCapacity}</p>}
      </div>

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
          {isLoading ? 'Saving...' : experience ? 'Update Experience' : 'Create Experience'}
        </Button>
      </div>
    </form>
  )
}