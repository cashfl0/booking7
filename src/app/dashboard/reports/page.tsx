import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and business insights</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-center max-w-md">
            Advanced reporting and analytics are currently under development. You'll be able to view revenue reports, booking trends, customer insights, and more.
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