import { Megaphone } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/coming-soon'

export default function MarketingPage() {
  return (
    <ComingSoon
      title="Marketing"
      description="Promote your events and reach more customers"
      icon={<Megaphone className="w-6 h-6" />}
    />
  )
}