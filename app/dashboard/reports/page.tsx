import { BarChart3 } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/coming-soon'

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="Analytics and insights for your business"
      icon={<BarChart3 className="w-6 h-6" />}
    />
  )
}