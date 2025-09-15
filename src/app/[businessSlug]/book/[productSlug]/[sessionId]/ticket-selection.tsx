'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
interface TicketType {
  id: string
  name: string
  description?: string | null
  price: number
  minAge?: number | null
  maxAge?: number | null
  requiresTicketTypeId?: string | null
}

interface AddOn {
  id: string
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isRequired: boolean
}

interface Session {
  id: string
  startTime: Date
  endTime: Date
  maxCapacity: number
  bookedCapacity: number
}

interface Product {
  id: string
  name: string
  description?: string | null
  ticketTypes: TicketType[]
  addOns: AddOn[]
}

interface TicketSelectionProps {
  product: Product
  session: Session
  otherSessions: Session[]
  businessSlug: string
  productSlug: string
}

export default function TicketSelection({
  product,
  session,
  otherSessions,
  businessSlug,
  productSlug
}: TicketSelectionProps) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({})

  const updateQuantity = (id: string, change: number, isAddon = false) => {
    if (isAddon) {
      setAddonQuantities(prev => ({
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) + change)
      }))
    } else {
      setQuantities(prev => ({
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) + change)
      }))
    }
  }

  const getTotal = () => {
    let total = 0

    // Calculate ticket totals
    product.ticketTypes.forEach(ticket => {
      const qty = quantities[ticket.id] || 0
      total += qty * ticket.price
    })

    // Calculate addon totals
    product.addOns.forEach(addon => {
      const qty = addonQuantities[addon.id] || 0
      total += qty * addon.price
    })

    return total
  }

  const getTotalItems = () => {
    const ticketCount = Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
    const addonCount = Object.values(addonQuantities).reduce((sum, qty) => sum + qty, 0)
    return ticketCount + addonCount
  }

  const hasRequiredTickets = () => {
    // Check if at least one paid ticket is selected
    const hasMainTicket = product.ticketTypes.some(ticket =>
      ticket.price > 0 && (quantities[ticket.id] || 0) > 0
    )
    return hasMainTicket
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleContinue = () => {
    // Store cart data in localStorage for now
    const cartData = {
      productId: product.id,
      sessionId: session.id,
      tickets: quantities,
      addOns: addonQuantities,
      total: getTotal()
    }
    localStorage.setItem('cart', JSON.stringify(cartData))
    router.push(`/${businessSlug}/checkout`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with selected time */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white hover:bg-white/20"
            >
              <Link href={`/${businessSlug}/book/${productSlug}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-white/90">Selected time: {formatTime(session.startTime)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Time Selection Display */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a time</h2>
          <div className="flex gap-3 flex-wrap">
            {otherSessions.slice(0, 6).map((otherSession) => {
              const isSelected = otherSession.id === session.id
              const timeStr = formatTime(otherSession.startTime)
              const availableSpots = otherSession.maxCapacity - otherSession.bookedCapacity
              const isAvailable = availableSpots > 0

              return (
                <Button
                  key={otherSession.id}
                  variant={isSelected ? "default" : "outline"}
                  className={isSelected ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500" : ""}
                  disabled={!isAvailable}
                  asChild={isAvailable && !isSelected}
                >
                  {isAvailable && !isSelected ? (
                    <Link href={`/${businessSlug}/book/${productSlug}/${otherSession.id}`}>
                      {timeStr}
                    </Link>
                  ) : (
                    <span>{timeStr}{!isAvailable ? ' (Full)' : ''}</span>
                  )}
                </Button>
              )
            })}
          </div>
          {otherSessions.length > 6 && (
            <Button variant="ghost" className="mt-2">
              Show more times
              <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>

        {/* Ticket Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select tickets</h2>
          <div className="space-y-4">
            {product.ticketTypes.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{ticket.name}</h3>
                      <div className="text-lg font-semibold text-gray-900">
                        ${ticket.price.toFixed(2)}
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                      )}
                      <Button variant="ghost" size="sm" className="text-blue-600 p-0">
                        Details
                        <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(ticket.id, -1)}
                        disabled={(quantities[ticket.id] || 0) === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {quantities[ticket.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(ticket.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add-ons Section */}
        {product.addOns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Add-ons</h2>

            {product.addOns.map((addon) => (
              <Card key={addon.id} className="mb-4">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-xl">🧦</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {addon.name.toUpperCase()}
                      </h3>
                      {addon.description && (
                        <p className="text-gray-600 text-sm mb-3">{addon.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-gray-900">
                          <span className="font-medium">{addon.name}</span>
                          <div className="text-lg font-semibold">${addon.price.toFixed(2)}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(addon.id, -1, true)}
                            disabled={(addonQuantities[addon.id] || 0) === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {addonQuantities[addon.id] || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(addon.id, 1, true)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="text-blue-600">
              🛒 View cart ({getTotalItems()} items)
              <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${getTotal().toFixed(2)}
              </div>
              <Button
                className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8"
                disabled={!hasRequiredTickets()}
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for fixed cart */}
      <div className="h-24"></div>
    </div>
  )
}