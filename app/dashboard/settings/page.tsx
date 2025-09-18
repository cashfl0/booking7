import { Settings } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/coming-soon'

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Configure your business and account settings"
      icon={<Settings className="w-6 h-6" />}
    />
  )
}