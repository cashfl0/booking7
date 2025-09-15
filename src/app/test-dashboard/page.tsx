import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'

export default function TestDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold">Test Dashboard</h1>
        <p>This is a test dashboard without auth restrictions.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Revenue</h3>
            <p className="text-2xl font-bold">$1,234.56</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Bookings</h3>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Guests</h3>
            <p className="text-2xl font-bold">128</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Avg Order</h3>
            <p className="text-2xl font-bold">$29.39</p>
          </div>
        </div>
      </main>
    </div>
  )
}