'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  ShoppingCart,
  Target,
  AlertCircle
} from 'lucide-react'

interface Metrics {
  todayRevenue: number
  todayBookings: number
  todayGuests: number
  totalCustomers: number
  upcomingSessions: Array<{
    id: string
    productName: string
    startTime: Date
    endTime: Date
    bookingCount: number
    capacity: number
  }>
  recentBookings: Array<{
    id: string
    customerName: string
    customerEmail: string
    productName: string
    sessionTime: Date | null
    amount: number
    status: string
    createdAt: Date
  }>
}

interface DashboardOverviewProps {
  metrics: Metrics
}

export default function DashboardOverview({ metrics }: DashboardOverviewProps) {
  const averageOrderValue = metrics.todayBookings > 0
    ? metrics.todayRevenue / metrics.todayBookings
    : 0

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800'
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600">Today's performance at a glance</p>
      </div>

      {/* Daily Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${metrics.todayRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bookings Today</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.todayBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guests Today</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.todayGuests}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${averageOrderValue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Sessions (Next 3 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.upcomingSessions.length > 0 ? (
                metrics.upcomingSessions.map((session) => {
                  const utilizationRate = (session.bookingCount / session.capacity) * 100
                  const isNearCapacity = utilizationRate >= 80

                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{session.productName}</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {session.bookingCount}/{session.capacity}
                          </span>
                          {isNearCapacity && (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {utilizationRate.toFixed(0)}% full
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentBookings.length > 0 ? (
                metrics.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.productName}</p>
                      <p className="text-xs text-gray-500">
                        {booking.sessionTime ? formatDate(booking.sessionTime) : 'No session time'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${booking.amount.toFixed(2)}</p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent bookings</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
              </div>
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.upcomingSessions.length > 0
                    ? Math.round(
                        metrics.upcomingSessions.reduce((acc, session) =>
                          acc + (session.bookingCount / session.capacity), 0
                        ) / metrics.upcomingSessions.length * 100
                      )
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions Today</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.upcomingSessions.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}