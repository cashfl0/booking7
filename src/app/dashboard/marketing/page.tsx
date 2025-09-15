import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, Clock } from 'lucide-react'

export default function MarketingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600">Promote your business and engage customers</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Megaphone className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-center max-w-md">
            Marketing tools are currently under development. You'll be able to create promotions, manage email campaigns, track marketing pixels, and analyze campaign performance.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Expected release: Next update</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}