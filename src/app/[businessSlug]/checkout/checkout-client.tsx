'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface CartItem {
  productId: string
  sessionId: string
  tickets: Record<string, number>
  addOns: Record<string, number>
  total: number
}

interface CheckoutClientProps {
  businessSlug: string
}

export default function CheckoutClient({ businessSlug }: CheckoutClientProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    subscribeToEmails: true,
    acceptTerms: false
  })
  const [discountCode, setDiscountCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load cart from localStorage
    const cartData = localStorage.getItem('cart')
    if (cartData) {
      setCart(JSON.parse(cartData))
    } else {
      // Redirect back if no cart data
      router.push(`/${businessSlug}`)
    }
  }, [businessSlug, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cart || !formData.acceptTerms) return

    setIsLoading(true)

    // In a real app, this would create a booking and redirect to payment
    // For now, we'll just simulate the process
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store booking data
      const bookingData = {
        ...formData,
        cart,
        bookingNumber: 'BK' + Date.now(),
        createdAt: new Date().toISOString()
      }

      localStorage.setItem('booking', JSON.stringify(bookingData))
      localStorage.removeItem('cart') // Clear cart

      // Redirect to payment page
      router.push(`/${businessSlug}/payment`)
    } catch (error) {
      console.error('Booking failed:', error)
      setIsLoading(false)
    }
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No items in cart</h2>
          <p className="text-gray-600 mb-4">Add some tickets to continue with checkout.</p>
          <Button asChild>
            <Link href={`/${businessSlug}`}>
              Browse Tickets
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.acceptTerms

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-gray-600 hover:bg-gray-100"
            >
              <Link href={`/${businessSlug}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Your details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Please enter your details before checking out.{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in to an account
            </Link>{' '}
            or{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              create an account
            </Link>
          </p>
        </div>

        {/* Urgency Alert */}
        <div className="mb-6 p-4 bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-3">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">!</span>
          </div>
          <p className="text-purple-800">
            Spots fill up fast - secure your tickets now and guarantee your bounce time!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First name<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last name<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Contact number<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="mt-1 flex">
                  <select className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-r-none border-r-0">
                    <option value="+1">🇺🇸</option>
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(123) 456-7890"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1 rounded-l-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                  Zip code<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Discount Code */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply a discount</h3>
              <p className="text-gray-600 text-sm mb-4">
                Redeem a discount code, gift card or membership below
              </p>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Enter code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" type="button">
                  Redeem now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="subscribe"
                checked={formData.subscribeToEmails}
                onCheckedChange={(checked) =>
                  handleInputChange('subscribeToEmails', checked === true)
                }
              />
              <Label htmlFor="subscribe" className="text-sm text-gray-700">
                Subscribe to learn about special events at Funbox and receive exclusive discounts!
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  handleInputChange('acceptTerms', checked === true)
                }
                required
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                I have read and accept the{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms and conditions
                </Link>
              </Label>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-12 text-base font-semibold"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </form>
      </div>

      {/* Fixed Bottom Cart Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                View cart ({Object.values(cart.tickets).reduce((a, b) => a + b, 0) + Object.values(cart.addOns).reduce((a, b) => a + b, 0)} items)
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${cart.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for fixed cart */}
      <div className="h-20"></div>
    </div>
  )
}