'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { GuestForm, CartItem, Session } from '../types/booking-types'

interface GuestDetailsFormProps {
  guestForm: GuestForm
  onFormChange: (field: keyof GuestForm, value: string | boolean) => void
  cartItems: CartItem[]
  totalPrice: number
  selectedSession: Session
  canProceed: boolean
  onContinue: () => void
}

export function GuestDetailsForm({
  guestForm,
  onFormChange,
  cartItems,
  totalPrice,
  selectedSession,
  canProceed,
  onContinue
}: GuestDetailsFormProps) {
  return (
    <Card className="mb-6" id="checkout-section">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Enter Your Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={guestForm.firstName}
                onChange={(e) => onFormChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={guestForm.lastName}
                onChange={(e) => onFormChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={guestForm.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={guestForm.phone}
              onChange={(e) => onFormChange('phone', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="marketingOptIn"
              checked={guestForm.marketingOptIn}
              onChange={(e) => onFormChange('marketingOptIn', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="marketingOptIn" className="text-sm">
              I&apos;d like to receive marketing emails about upcoming events
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="termsAccepted"
              checked={guestForm.termsAccepted}
              onChange={(e) => onFormChange('termsAccepted', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              required
            />
            <Label htmlFor="termsAccepted" className="text-sm">
              I agree to the terms and conditions *
            </Label>
          </div>

          {/* Final Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-3">Final Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{format(new Date(selectedSession.startTime), 'MMM d, yyyy h:mm a')}</span>
              </div>
              {cartItems.map((item, index) => (
                <div key={`final-${item.type}-${item.id}-${index}`} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onContinue}
            disabled={!canProceed}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Continue to Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}