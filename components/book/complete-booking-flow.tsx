'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useAnalytics } from '@/components/analytics/analytics-provider'

// Import all section components
import { DateTimeSelection } from './sections/date-time-selection'
import { TicketSelection } from './sections/ticket-selection'
import { AddonSelection } from './sections/addon-selection'
import { GuestDetailsForm } from './sections/guest-details-form'
import { PaymentFormComponent } from './sections/payment-form'
import { BookingConfirmationComponent } from './sections/booking-confirmation'

// Import shared types
import {
  Business,
  Experience,
  Event,
  Session,
  AddOn,
  CartItem,
  GuestForm,
  PaymentForm,
  BookingConfirmation
} from './types/booking-types'

interface CompleteBookingFlowProps {
  business: Business
  experience: Experience
  event: Event
  sessionsByDate: Record<string, Session[]>
  addOns: AddOn[]
}

export function CompleteBookingFlow({
  business,
  experience,
  event,
  sessionsByDate,
  addOns
}: CompleteBookingFlowProps) {
  const { trackEvent } = useAnalytics(business.slug)

  // Date/Time Selection State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Ticket Selection State
  const [ticketQuantity, setTicketQuantity] = useState(0)

  // Add-on Selection State
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({})

  // Checkout Form State
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [guestForm, setGuestForm] = useState<GuestForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    marketingOptIn: false,
    termsAccepted: false
  })

  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/28',
    cvv: '123',
    nameOnCard: 'Test User',
    billingZip: '12345'
  })

  // Payment & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [confirmationData, setConfirmationData] = useState<BookingConfirmation | null>(null)

  // Cart calculations
  const cartItems: CartItem[] = []
  const safeTicketQuantity = isNaN(ticketQuantity) ? 0 : ticketQuantity
  const sessionPrice = event.basePrice || 0

  if (safeTicketQuantity > 0 && selectedSession) {
    cartItems.push({
      type: 'session',
      id: selectedSession.id,
      name: `${event.name} Tickets`,
      price: sessionPrice,
      quantity: safeTicketQuantity
    })
  }

  addOns.forEach(addOn => {
    const quantity = addOnQuantities[addOn.id] || 0
    if (quantity > 0) {
      cartItems.push({
        type: 'addon',
        id: addOn.id,
        name: addOn.name,
        price: Number(addOn.price),
        quantity
      })
    }
  })

  const totalPrice = cartItems.reduce((sum, item) => {
    const itemPrice = isNaN(item.price) ? 0 : item.price
    const itemQuantity = isNaN(item.quantity) ? 0 : item.quantity
    return sum + (itemPrice * itemQuantity)
  }, 0)

  // Availability check
  const getAvailableCapacity = (session: Session) => {
    const maxCapacity = session.maxCapacity || event.maxCapacity || experience.maxCapacity || 10
    return maxCapacity - session.currentCount
  }

  // Navigation helpers
  const canProceedToCheckout = safeTicketQuantity > 0
  const canSubmitCheckout = guestForm.firstName && guestForm.lastName && guestForm.email && guestForm.termsAccepted
  const canProceedToPayment = Boolean(canSubmitCheckout)
  const canProcessPayment = Boolean(paymentForm.cardNumber && paymentForm.expiryDate && paymentForm.cvv && paymentForm.nameOnCard)

  // Event handlers
  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session)
    // Reset form progression when session changes
    setShowCheckoutForm(false)
    setShowPaymentForm(false)
    // Smooth scroll to ticket selection
    setTimeout(() => {
      const ticketSection = document.getElementById('ticket-section')
      if (ticketSection) {
        ticketSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setSelectedSession(null) // Reset session when date changes
    setShowCheckoutForm(false)
    setShowPaymentForm(false)
  }

  const updateGuestForm = (field: keyof GuestForm, value: string | boolean) => {
    setGuestForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updatePaymentForm = (field: keyof PaymentForm, value: string) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProceedToCheckout = () => {
    // Track begin_checkout event
    trackEvent({
      event_name: 'begin_checkout',
      value: totalPrice,
      currency: 'USD',
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    })

    setShowCheckoutForm(true)
    setTimeout(() => {
      const checkoutSection = document.getElementById('checkout-section')
      if (checkoutSection) {
        checkoutSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleProceedToPayment = () => {
    // Track add_payment_info event
    trackEvent({
      event_name: 'add_payment_info',
      value: totalPrice,
      currency: 'USD'
    })

    setShowPaymentForm(true)
    setTimeout(() => {
      const paymentSection = document.getElementById('payment-section')
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canProcessPayment || !selectedSession) {
      alert('Please fill in all payment fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Create guest and process payment
      const response = await fetch('/api/book/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest: {
            ...guestForm,
            businessId: business.id
          },
          booking: {
            sessionId: selectedSession.id,
            quantity: safeTicketQuantity,
            total: totalPrice,
            items: cartItems.map(item => ({
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              itemType: item.type === 'session' ? 'SESSION' : 'ADD_ON',
              addOnId: item.type === 'addon' ? item.id : null
            }))
          },
          payment: paymentForm
        }),
      })

      if (!response.ok) {
        throw new Error('Payment failed')
      }

      const result = await response.json()
      setConfirmationData(result)
      setBookingConfirmed(true)

      // Track purchase completion
      trackEvent({
        event_name: 'purchase',
        value: totalPrice,
        currency: 'USD',
        items: cartItems.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      })

      // Scroll to confirmation
      setTimeout(() => {
        const confirmationSection = document.getElementById('confirmation-section')
        if (confirmationSection) {
          confirmationSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)

    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateAddOnQuantity = (addOnId: string, quantity: number) => {
    setAddOnQuantities(prev => ({
      ...prev,
      [addOnId]: quantity
    }))
  }

  // If booking is confirmed, show confirmation component
  if (bookingConfirmed && selectedSession) {
    return (
      <BookingConfirmationComponent
        business={business}
        experience={experience}
        event={event}
        selectedSession={selectedSession}
        guestForm={guestForm}
        totalPrice={totalPrice}
        ticketQuantity={safeTicketQuantity}
        confirmationData={confirmationData}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/book/${business.slug}/${experience.slug}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {experience.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
          <p className="text-lg text-gray-600">{event.name}</p>
          {event.description && <p className="text-gray-500 mt-2">{event.description}</p>}
        </div>

        {/* Step 1: Date/Time Selection */}
        <DateTimeSelection
          sessionsByDate={sessionsByDate}
          selectedDate={selectedDate}
          selectedSession={selectedSession}
          onDateChange={handleDateChange}
          onSessionSelect={handleSessionSelect}
          getAvailableCapacity={getAvailableCapacity}
        />

        {/* Step 2: Ticket Selection */}
        {selectedSession && (
          <TicketSelection
            event={event}
            session={selectedSession}
            ticketQuantity={ticketQuantity}
            onQuantityChange={setTicketQuantity}
            getAvailableCapacity={getAvailableCapacity}
          />
        )}

        {/* Step 3: Add-ons Selection */}
        <AddonSelection
          addOns={addOns}
          addOnQuantities={addOnQuantities}
          onQuantityChange={updateAddOnQuantity}
          ticketQuantity={ticketQuantity}
        />

        {/* Step 4: Order Summary & Proceed */}
        {canProceedToCheckout && !showCheckoutForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((item, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
              >
                Continue to Checkout
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Guest Details Form */}
        {showCheckoutForm && !bookingConfirmed && selectedSession && (
          <GuestDetailsForm
            guestForm={guestForm}
            onFormChange={updateGuestForm}
            cartItems={cartItems}
            totalPrice={totalPrice}
            selectedSession={selectedSession}
            canProceed={canProceedToPayment}
            onContinue={handleProceedToPayment}
          />
        )}

        {/* Step 6: Payment Form */}
        {showPaymentForm && !bookingConfirmed && selectedSession && (
          <PaymentFormComponent
            paymentForm={paymentForm}
            onFormChange={updatePaymentForm}
            guestForm={guestForm}
            cartItems={cartItems}
            totalPrice={totalPrice}
            selectedSession={selectedSession}
            canSubmit={canProcessPayment}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitPayment}
          />
        )}
      </div>
    </div>
  )
}