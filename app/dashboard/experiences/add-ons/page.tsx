import { Package } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/coming-soon'

export default function AddOnsPage() {
  return (
    <ComingSoon
      title="Add-ons"
      description="Create and manage add-ons for your events"
      icon={<Package className="w-6 h-6" />}
    />
  )
}