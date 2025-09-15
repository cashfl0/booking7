'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  experience: {
    name: string
  }
}

interface CreateAddOnFormProps {
  businessId: string
  products: Product[]
}

export default function CreateAddOnForm({ businessId, products }: CreateAddOnFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    productId: '',
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
      const response = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          businessId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create add-on')
      }

      router.push('/dashboard/products/addons')
      router.refresh()
    } catch (error) {
      console.error('Error creating add-on:', error)
      // TODO: Add toast notification for errors
    } finally {
      setLoading(false)
    }
  }

  // Group products by experience for better organization
  const productsByExperience = products.reduce((acc, product) => {
    const experienceName = product.experience.name
    if (!acc[experienceName]) {
      acc[experienceName] = []
    }
    acc[experienceName].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/products/addons">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <CardTitle>Add-on Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Add-on Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Bounce Socks, Energy Drink, Party Package"
              required
            />
            <p className="text-xs text-gray-500">
              Choose a clear, descriptive name for this add-on item
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="bounce-socks"
              required
            />
            <p className="text-xs text-gray-500">
              This will be used in URLs. It's automatically generated from the name but can be customized.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this add-on item for your customers..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Optional description that will be shown to customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="pl-8"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Price customers will pay for this add-on
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productId">Product *</Label>
              <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(productsByExperience).map(([experienceName, experienceProducts]) => (
                    <div key={experienceName}>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-500">
                        {experienceName}
                      </div>
                      {experienceProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                The product this add-on will be available for
              </p>
            </div>
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
                Only active add-ons are shown to customers
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading || !formData.productId}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Add-on
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/products/addons">
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}