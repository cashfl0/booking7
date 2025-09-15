'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ShoppingCart, Lock, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  zipCode: string
  subscribeToEmails: boolean
  acceptTerms: boolean
  cart: {
    productId: string
    sessionId: string
    tickets: Record<string, number>
    addOns: Record<string, number>
    total: number
  }
  bookingNumber: string
  createdAt: string
}

interface PaymentClientProps {
  businessSlug: string
}

export default function PaymentClient({ businessSlug }: PaymentClientProps) {
  const router = useRouter()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay' | 'google-pay'>('card')
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    zipCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [saveCard, setSaveCard] = useState(false)

  useEffect(() => {
    // Load booking from localStorage
    const bookingData = localStorage.getItem('booking')
    if (bookingData) {
      setBooking(JSON.parse(bookingData))
    } else {
      // Redirect back if no booking data
      router.push(`/${businessSlug}`)
    }
  }, [businessSlug, router])

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    setIsLoading(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Store payment confirmation
      const confirmationData = {
        ...booking,
        paymentMethod,
        paymentConfirmed: true,
        confirmationNumber: 'CNF' + Date.now(),
        paidAt: new Date().toISOString()
      }

      localStorage.setItem('confirmation', JSON.stringify(confirmationData))
      localStorage.removeItem('booking') // Clear booking

      // Redirect to confirmation page
      router.push(`/${businessSlug}/confirmation`)
    } catch (error) {
      console.error('Payment failed:', error)
      setIsLoading(false)
    }
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No booking found</h2>
          <p className="text-gray-600 mb-4">Please start a new booking.</p>
          <Button asChild>
            <Link href={`/${businessSlug}`}>
              Start Booking
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isFormValid =
    paymentMethod === 'card'
      ? cardData.number && cardData.expiry && cardData.cvc && cardData.name
      : true

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
              <Link href={`/${businessSlug}/checkout`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Payment</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Security Notice */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Lock className="w-5 h-5 text-green-600" />
          <p className="text-green-800 text-sm">
            Your payment information is secure and encrypted
          </p>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment method</h3>

              <div className="space-y-3 mb-6">
                {/* Apple Pay */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'apple-pay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('apple-pay')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        {paymentMethod === 'apple-pay' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="font-medium">Apple Pay</span>
                    </div>
                    <div className="text-right">
                      <div className="bg-black text-white px-3 py-1 rounded text-sm font-medium">
                        Pay
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Pay */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'google-pay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('google-pay')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        {paymentMethod === 'google-pay' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="font-medium">Google Pay</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600 font-bold text-sm">G</span>
                        <span className="text-red-500 font-bold text-sm">o</span>
                        <span className="text-yellow-500 font-bold text-sm">o</span>
                        <span className="text-blue-600 font-bold text-sm">g</span>
                        <span className="text-green-500 font-bold text-sm">l</span>
                        <span className="text-red-500 font-bold text-sm">e</span>
                        <span className="text-black font-medium text-sm ml-1">Pay</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit/Debit Card */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      {paymentMethod === 'card' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Credit or debit card</span>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                      Card number
                    </Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.number}
                      onChange={(e) => handleCardInputChange('number', e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">
                        Expiry date
                      </Label>
                      <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-sm font-medium text-gray-700">
                        CVC
                      </Label>
                      <Input
                        id="cvc"
                        type="text"
                        placeholder="123"
                        value={cardData.cvc}
                        onChange={(e) => handleCardInputChange('cvc', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">
                      Name on card
                    </Label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="John Doe"
                      value={cardData.name}
                      onChange={(e) => handleCardInputChange('name', e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardZip" className="text-sm font-medium text-gray-700">
                      Zip code
                    </Label>
                    <Input
                      id="cardZip"
                      type="text"
                      placeholder="12345"
                      value={cardData.zipCode}
                      onChange={(e) => handleCardInputChange('zipCode', e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="saveCard"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(checked === true)}
                    />
                    <Label htmlFor="saveCard" className="text-sm text-gray-700">
                      Save this card for future purchases
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Payment Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-12 text-base font-semibold"
          >
            {isLoading ? 'Processing payment...' : `Complete payment $${booking.cart.total.toFixed(2)}`}
          </Button>

          {/* Powered by TicketUp */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Powered by <span className="font-semibold">TicketUp</span>
            </p>
          </div>
        </form>
      </div>

      {/* Fixed Bottom Cart Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                {booking.firstName} {booking.lastName} - {booking.bookingNumber}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${booking.cart.total.toFixed(2)}
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