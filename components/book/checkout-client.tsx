'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Clock } from 'lucide-react'

interface Business {
  id: string
  name: string
  slug: string
}

interface Experience {
  id: string
  name: string
  slug: string
  basePrice: number
}

interface Event {
  id: string
  name: string
  slug: string
}

interface Session {
  id: string
  startTime: string
  endTime: string
}


interface CheckoutClientProps {
  business: Business
  experience: Experience
  event: Event
  session: Session
  initialCart: { [key: string]: string | string[] | undefined }
}

interface GuestForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  zipCode: string
  marketingOptIn: boolean
  termsAccepted: boolean
}

export function CheckoutClient({
  business,
  experience,
  event,
  session,
  initialCart
}: CheckoutClientProps) {
  const [guestForm, setGuestForm] = useState<GuestForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    marketingOptIn: true,
    termsAccepted: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parse cart from URL params (simplified for now)
  const ticketQuantity = parseInt(initialCart.tickets as string) || 1
  const sessionPrice = Number(experience.basePrice) || 0
  const total = (isNaN(sessionPrice) ? 0 : sessionPrice) * (isNaN(ticketQuantity) ? 1 : ticketQuantity)

  console.log('Checkout debug:', {
    experienceBasePrice: experience.basePrice,
    sessionPrice,
    ticketQuantity,
    total,
    experiencePriceType: typeof experience.basePrice
  })

  const handleInputChange = (field: keyof GuestForm, value: string | boolean) => {
    setGuestForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestForm.termsAccepted) {
      alert('Please accept the terms and conditions')
      return
    }

    setIsSubmitting(true)

    try {
      // Create guest record early for abandoned cart remarketing
      const response = await fetch('/api/book/create-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...guestForm,
          businessId: business.id,
          sessionId: session.id,
          ticketQuantity,
          total
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create guest')
      }

      const guest = await response.json()

      // Redirect to payment with guest ID and cart data
      const safeTotal = isNaN(total) ? 0 : total
      const params = new URLSearchParams({
        guestId: guest.id,
        sessionId: session.id,
        tickets: ticketQuantity.toString(),
        total: safeTotal.toString()
      })

      window.location.href = `/${business.slug}/payment?${params.toString()}`
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = guestForm.firstName && guestForm.lastName && guestForm.email && guestForm.termsAccepted

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="p-6 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center mb-4">
            <Link
              href={`/book/${business.slug}/${experience.slug}/${event.slug}/${session.id}`}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Your details</h1>
          <p className="text-sm text-gray-600">
            Please enter your details before checking out.{' '}
            <button className="text-blue-600">Sign in</button> to an account or{' '}
            <button className="text-blue-600">create an account</button>
          </p>
        </div>

        {/* Urgency Banner */}
        <div className="mx-6 mt-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-purple-800 font-medium text-sm">
                Spots fill up fast - secure your tickets now and guarantee your bounce time!
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Guest Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First name*</Label>
              <Input
                id="firstName"
                type="text"
                value={guestForm.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last name*</Label>
              <Input
                id="lastName"
                type="text"
                value={guestForm.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email address*</Label>
              <Input
                id="email"
                type="email"
                value={guestForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Contact number*</Label>
              <div className="flex mt-1">
                <select className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm">
                  <option>🇺🇸 +1</option>
                </select>
                <Input
                  id="phone"
                  type="tel"
                  value={guestForm.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="rounded-l-none border-l-0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zipCode">Zip code*</Label>
              <Input
                id="zipCode"
                type="text"
                value={guestForm.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Discount Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Apply a discount</h3>
            <p className="text-sm text-gray-600 mb-3">
              Redeem a discount code, gift card or membership below
            </p>
            <Button variant="outline" className="w-full">
              Redeem now
            </Button>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={guestForm.marketingOptIn}
                onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                Subscribe to learn about special events and receive exclusive discounts!
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={guestForm.termsAccepted}
                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                required
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the{' '}
                <button type="button" className="text-blue-600 underline">
                  Terms and conditions
                </button>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </form>

        {/* Cart Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex items-center justify-between">
            <button className="text-blue-600 font-medium flex items-center">
              🛒 View cart ({ticketQuantity} items) ↑
            </button>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${(isNaN(total) ? 0 : total).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}