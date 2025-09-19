'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Minus, Plus } from 'lucide-react'
import { Event, Session } from '../types/booking-types'

interface TicketSelectionProps {
  event: Event
  session: Session
  ticketQuantity: number
  onQuantityChange: (quantity: number) => void
  getAvailableCapacity: (session: Session) => number
}

export function TicketSelection({
  event,
  session,
  ticketQuantity,
  onQuantityChange,
  getAvailableCapacity
}: TicketSelectionProps) {
  const availableCapacity = getAvailableCapacity(session)
  const sessionPrice = event.basePrice || 0

  return (
    <Card className="mb-6" id="ticket-section">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Select Tickets</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{event.name}</h3>
            <p className="text-gray-600">${sessionPrice.toFixed(2)} per person</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(Math.max(0, ticketQuantity - 1))}
              disabled={ticketQuantity <= 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medium text-lg min-w-[2rem] text-center">{ticketQuantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (ticketQuantity < availableCapacity) {
                  onQuantityChange(ticketQuantity + 1)
                }
              }}
              disabled={ticketQuantity >= availableCapacity}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}