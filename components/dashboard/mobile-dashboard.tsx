'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
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
  Menu,
  X
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
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
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileDashboard({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Experiences'])
  const pathname = usePathname()

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const NavItem = ({ item, isChild = false }: { item: NavigationItem, isChild?: boolean }) => {
    const isActive = pathname === item.href
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)

    return (
      <div>
        <Link
          href={item.href}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.name)
            }
            // Close mobile menu when navigating
            setSidebarOpen(false)
          }}
          className={`
            flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors
            ${isChild ? 'pl-12' : ''}
            ${isActive
              ? 'bg-gray-800 text-white border-r-2 border-blue-400'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }
          `}
        >
          <div className="flex items-center">
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </div>
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </Link>

        {hasChildren && isExpanded && (
          <div className="bg-gray-800">
            {item.children?.map((child: NavigationItem) => (
              <NavItem key={child.name} item={child} isChild />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <h1 className="text-xl font-bold text-white">
            Ticket<span className="text-blue-400">Up</span>
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-0 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">
            Ticket<span className="text-blue-500">Up</span>
          </h1>
          <div className="w-6 h-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}