'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddOnForm } from '@/components/dashboard/addon-form'
import Link from 'next/link'

export default function NewAddOnPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: {
    name: string
    description: string | null
    price: number
    isActive: boolean
    sortOrder: number
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/addons', {
        method: 'POST',
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
        throw new Error(error.error || 'Failed to create add-on')
      }

      router.push('/dashboard/experiences/add-ons')
    } catch (error) {
      console.error('Error creating add-on:', error)
      alert(error instanceof Error ? error.message : 'Failed to create add-on')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/experiences/add-ons')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/experiences/add-ons">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Add-on</h1>
          <p className="text-muted-foreground">
            Create a new global add-on for your business
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add-on Details</CardTitle>
          <CardDescription>
            This add-on will be available to associate with any of your events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddOnForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}