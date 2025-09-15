import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  console.log('Dashboard layout session:', session)

  if (!session) {
    console.log('Redirecting to signin - no session')
    redirect('/auth/signin')
  }

  if (session.user.role !== 'BUSINESS_OWNER') {
    console.log('Redirecting to signin - wrong role:', session.user.role)
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}