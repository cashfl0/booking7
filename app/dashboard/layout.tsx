import { MobileDashboard } from '@/components/dashboard/mobile-dashboard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication is handled by middleware.ts
  // No need for redundant session check here
  return <MobileDashboard>{children}</MobileDashboard>
}