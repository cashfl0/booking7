'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Minus, Plus } from 'lucide-react'
import { AddOn } from '../types/booking-types'

interface AddonSelectionProps {
  addOns: AddOn[]
  addOnQuantities: Record<string, number>
  onQuantityChange: (addOnId: string, quantity: number) => void
  ticketQuantity: number
}

export function AddonSelection({
  addOns,
  addOnQuantities,
  onQuantityChange,
  ticketQuantity
}: AddonSelectionProps) {
  if (ticketQuantity === 0 || addOns.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add-ons</h2>
        <div className="space-y-4">
          {addOns.map(addOn => (
            <div key={addOn.id} className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{addOn.name}</h3>
                {addOn.description && <p className="text-gray-600 text-sm">{addOn.description}</p>}
                <p className="text-gray-900 font-medium">${Number(addOn.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(
                    addOn.id,
                    Math.max(0, (addOnQuantities[addOn.id] || 0) - 1)
                  )}
                  disabled={!addOnQuantities[addOn.id] || addOnQuantities[addOn.id] <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-medium text-lg min-w-[2rem] text-center">
                  {addOnQuantities[addOn.id] || 0}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(
                    addOn.id,
                    (addOnQuantities[addOn.id] || 0) + 1
                  )}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}