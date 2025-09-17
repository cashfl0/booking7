import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="space-y-8">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
              Ticket<span className="text-blue-600">Up</span>
            </h1>
            <p className="text-2xl text-gray-600 font-light">
              The Modern Ticketing Platform Built For You
            </p>
          </div>

          {/* Description */}
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed">
              Streamline your event management with our powerful, intuitive platform.
              Create experiences, manage events, and sell tickets with ease.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Sign In to Your Dashboard
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="text-blue-600 text-xl">🎯</div>
              <h3 className="font-semibold text-gray-900">Simple Setup</h3>
              <p className="text-gray-600 text-sm">Get your events online in minutes</p>
            </div>
            <div className="space-y-2">
              <div className="text-blue-600 text-xl">📅</div>
              <h3 className="font-semibold text-gray-900">Flexible Scheduling</h3>
              <p className="text-gray-600 text-sm">Multiple sessions, dates, and pricing</p>
            </div>
            <div className="space-y-2">
              <div className="text-blue-600 text-xl">📊</div>
              <h3 className="font-semibold text-gray-900">Real-time Analytics</h3>
              <p className="text-gray-600 text-sm">Track bookings and revenue instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}