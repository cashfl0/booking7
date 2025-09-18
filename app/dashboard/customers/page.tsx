import { Users } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/coming-soon'

export default function CustomersPage() {
  return (
    <ComingSoon
      title="Customers"
      description="View and manage your customer database"
      icon={<Users className="w-6 h-6" />}
    />
  )
}