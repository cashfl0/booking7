'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Minus, Plus, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

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

interface AddOn {
  id: string
  name: string
  description?: string | null
  price: number
}

interface TicketSelectionClientProps {
  business: Business
  experience: Experience
  event: Event
  session: Session
  availableCapacity: number
  addOns: AddOn[]
}

interface CartItem {
  type: 'session' | 'addon'
  id: string
  name: string
  price: number
  quantity: number
}

export function TicketSelectionClient({
  business,
  experience,
  event,
  session,
  availableCapacity,
  addOns
}: TicketSelectionClientProps) {
  const [ticketQuantity, setTicketQuantity] = useState(0)
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({})
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})

  const sessionPrice = Number(experience.basePrice) || 0

  const handleTicketChange = (change: number) => {
    const currentQuantity = isNaN(ticketQuantity) ? 0 : ticketQuantity
    const maxCapacity = isNaN(availableCapacity) ? 10 : availableCapacity
    const newQuantity = Math.max(0, Math.min(maxCapacity, currentQuantity + change))
    setTicketQuantity(newQuantity)
  }

  const handleAddOnChange = (addOnId: string, change: number) => {
    const currentQuantity = addOnQuantities[addOnId] || 0
    const newQuantity = Math.max(0, currentQuantity + change)
    setAddOnQuantities(prev => ({
      ...prev,
      [addOnId]: newQuantity
    }))
  }

  const toggleDetails = (itemId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Calculate cart
  const cartItems: CartItem[] = []
  const safeTicketQuantity = isNaN(ticketQuantity) ? 0 : ticketQuantity

  if (safeTicketQuantity > 0) {
    cartItems.push({
      type: 'session',
      id: session.id,
      name: `${event.name} Tickets`,
      price: isNaN(sessionPrice) ? 0 : sessionPrice,
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
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const canProceed = (isNaN(ticketQuantity) ? 0 : ticketQuantity) > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="p-6 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center mb-4">
            <Link
              href={`/book/${business.slug}/${experience.slug}/${event.slug}`}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-600">
            {format(new Date(session.startTime), 'EEEE, MMMM d')} at{' '}
            {format(new Date(session.startTime), 'h:mm a')}
          </p>
        </div>

        {/* Selected Time (changeable) */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Select a time</h2>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="default"
              className="h-12 bg-yellow-400 text-black hover:bg-yellow-500"
            >
              {format(new Date(session.startTime), 'h:mm a')}
            </Button>
            <Button variant="outline" className="h-12" disabled>
              {format(new Date(session.startTime), 'h:mm a')}
            </Button>
            <Button variant="outline" className="h-12" disabled>
              {format(new Date(session.startTime), 'h:mm a')}
            </Button>
          </div>
          <button className="text-blue-600 text-sm font-medium mt-3">
            Show more times ↓
          </button>
        </div>

        {/* Select Tickets */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select tickets</h2>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">General Admission</h3>
                  <p className="text-sm text-gray-600">${(isNaN(sessionPrice) ? 0 : sessionPrice).toFixed(2)}</p>
                  <button
                    onClick={() => toggleDetails('session')}
                    className="text-blue-600 text-sm font-medium flex items-center mt-1"
                  >
                    Details <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {expandedDetails['session'] && (
                    <p className="text-xs text-gray-600 mt-2">
                      Access to {event.name} for the selected time slot.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTicketChange(-1)}
                    disabled={(isNaN(ticketQuantity) ? 0 : ticketQuantity) <= 0}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{isNaN(ticketQuantity) ? 0 : ticketQuantity}</span>
                  <button
                    onClick={() => handleTicketChange(1)}
                    disabled={(isNaN(ticketQuantity) ? 0 : ticketQuantity) >= (isNaN(availableCapacity) ? 10 : availableCapacity)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isNaN(availableCapacity) && availableCapacity <= 5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm font-medium">
                Only {availableCapacity} spots left!
              </p>
            </div>
          )}
        </div>

        {/* Select Add-ons */}
        {addOns.length > 0 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Add-ons</h2>

            <div className="space-y-4">
              {addOns.map((addOn) => (
                <Card key={addOn.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{addOn.name}</h3>
                        {addOn.description && (
                          <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                        )}
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          ${Number(addOn.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAddOnChange(addOn.id, -1)}
                          disabled={(addOnQuantities[addOn.id] || 0) <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {addOnQuantities[addOn.id] || 0}
                        </span>
                        <button
                          onClick={() => handleAddOnChange(addOn.id, 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cart Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="text-blue-600 font-medium flex items-center">
              🛒 View cart ({totalItems} items) ↑
            </button>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${(isNaN(totalPrice) ? 0 : totalPrice).toFixed(2)}
              </p>
            </div>
          </div>

          <Link href={canProceed ? `/book/${business.slug}/${experience.slug}/${event.slug}/${session.id}/checkout` : '#'}>
            <Button
              className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
              disabled={!canProceed}
            >
              Continue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}