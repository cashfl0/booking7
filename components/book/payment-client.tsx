'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Lock, CreditCard } from 'lucide-react'

interface Business {
  id: string
  name: string
  slug: string
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface PaymentClientProps {
  business: Business
  guest: Guest
  sessionId: string
  tickets: number
  total: number
}

export function PaymentClient({
  business,
  guest,
  sessionId,
  tickets,
  total
}: PaymentClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [nameOnCard, setNameOnCard] = useState(`${guest.firstName} ${guest.lastName}`)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // TODO: Implement Stripe payment processing
      const response = await fetch('/api/book/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest.id,
          businessId: business.id,
          sessionId,
          tickets,
          total,
          paymentMethod: {
            cardNumber,
            expiryDate,
            cvv,
            nameOnCard
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Payment failed')
      }

      const result = await response.json()

      // Redirect to confirmation
      window.location.href = `/${business.slug}/confirmation?bookingId=${result.bookingId}`
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/[^0-9]/gi, '')
    const matches = cleaned.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return cleaned
    }
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + (cleaned.length > 2 ? '/' + cleaned.substring(2, 4) : '')
    }
    return cleaned
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="p-6 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center mb-4">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Payment</h1>
          <p className="text-sm text-gray-600">
            Complete your booking with secure payment
          </p>
        </div>

        {/* Security Banner */}
        <div className="mx-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-green-800 font-medium text-sm">
                Your payment is secure and encrypted
              </p>
              <p className="text-green-700 text-sm">
                We use industry-standard security to protect your information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePayment} className="p-6 space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Guest</span>
                  <span className="text-gray-900">{guest.firstName} {guest.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="text-gray-900">{guest.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets</span>
                  <span className="text-gray-900">{tickets}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </h3>

            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Card number*
              </label>
              <input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry date*
                </label>
                <input
                  id="expiryDate"
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  CVV*
                </label>
                <input
                  id="cvv"
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 mb-1">
                Name on card*
              </label>
              <input
                id="nameOnCard"
                type="text"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full h-12 bg-green-600 text-white hover:bg-green-700 font-semibold"
          >
            {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By completing this payment, you agree to the terms and conditions
          </p>
        </form>
      </div>
    </div>
  )
}