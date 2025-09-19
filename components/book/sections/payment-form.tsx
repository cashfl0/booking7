'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { PaymentForm, CartItem, Session, GuestForm } from '../types/booking-types'

interface PaymentFormComponentProps {
  paymentForm: PaymentForm
  onFormChange: (field: keyof PaymentForm, value: string) => void
  guestForm: GuestForm
  cartItems: CartItem[]
  totalPrice: number
  selectedSession: Session
  canSubmit: boolean
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function PaymentFormComponent({
  paymentForm,
  onFormChange,
  guestForm,
  cartItems,
  totalPrice,
  selectedSession,
  canSubmit,
  isSubmitting,
  onSubmit
}: PaymentFormComponentProps) {
  return (
    <Card className="mb-6" id="payment-section">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nameOnCard">Name on Card *</Label>
            <Input
              id="nameOnCard"
              value={paymentForm.nameOnCard}
              onChange={(e) => onFormChange('nameOnCard', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              value={paymentForm.cardNumber}
              onChange={(e) => {
                // Simple formatting for demo (strip non-digits, add spaces)
                const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ')
                if (value.length <= 16) {
                  onFormChange('cardNumber', formatted)
                }
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                value={paymentForm.expiryDate}
                onChange={(e) => {
                  // Simple MM/YY formatting
                  const value = e.target.value.replace(/\D/g, '')
                  const formatted = value.replace(/(\d{2})(?=\d)/, '$1/')
                  if (value.length <= 4) {
                    onFormChange('expiryDate', formatted)
                  }
                }}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                value={paymentForm.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 4) {
                    onFormChange('cvv', value)
                  }
                }}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billingZip">Billing ZIP Code</Label>
            <Input
              id="billingZip"
              value={paymentForm.billingZip}
              onChange={(e) => onFormChange('billingZip', e.target.value)}
              placeholder="12345"
              maxLength={10}
            />
          </div>

          {/* Final Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Guest:</span>
                <span>{guestForm.firstName} {guestForm.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{format(new Date(selectedSession.startTime), 'MMM d, yyyy h:mm a')}</span>
              </div>
              {cartItems.map((item, index) => (
                <div key={`payment-${item.type}-${item.id}-${index}`} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total Charge</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
            🔒 This is a demo payment form. No real payment will be processed.
          </div>

          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isSubmitting ? 'Processing Payment...' : `Complete Booking - $${totalPrice.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}