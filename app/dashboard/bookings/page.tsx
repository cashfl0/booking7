import { Calendar } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/coming-soon'

export default function BookingsPage() {
  return (
    <ComingSoon
      title="Bookings"
      description="Manage customer bookings and reservations"
      icon={<Calendar className="w-6 h-6" />}
    />
  )
}