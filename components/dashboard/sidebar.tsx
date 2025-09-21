'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import {
  LayoutDashboard,
  Star,
  Calendar,
  CalendarDays,
  Package,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Experiences',
    href: '/dashboard/experiences',
    icon: Star,
    children: [
      { name: 'Events', href: '/dashboard/experiences/events', icon: CalendarDays },
      { name: 'Add-ons', href: '/dashboard/experiences/add-ons', icon: Package },
    ]
  },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Guests', href: '/dashboard/guests', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { name: 'Analytics Tracking', href: '/dashboard/settings/analytics', icon: BarChart3 },
    ]
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-800">
        <h1 className="text-xl font-bold text-white">
          Ticket<span className="text-blue-400">Up</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const hasChildren = item.children && item.children.length > 0
          const isParentActive = hasChildren && item.children.some(child => pathname === child.href)
          const isExpanded = expandedMenus[item.name] || isParentActive

          return (
            <div key={item.name}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive || isParentActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )}

              {/* Sub-navigation */}
              {hasChildren && isExpanded && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                          isChildActive
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <child.icon className="w-4 h-4 mr-3" />
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  )
}