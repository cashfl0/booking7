import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface BookingPageProps {
  params: Promise<{ businessSlug: string; productSlug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { businessSlug, productSlug } = await params

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug }
  })

  if (!business) {
    notFound()
  }

  const product = await prisma.product.findFirst({
    where: {
      slug: productSlug,
      experience: {
        businessId: business.id
      }
    },
    include: {
      experience: true,
      sessions: {
        where: {
          isActive: true,
          startTime: {
            gte: new Date() // Only future sessions
          }
        },
        orderBy: { startTime: 'asc' },
        take: 20 // Limit to next 20 sessions
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Group sessions by date
  const sessionsByDate = product.sessions.reduce((acc, session) => {
    const dateKey = session.startTime.toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(session)
    return acc
  }, {} as Record<string, typeof product.sessions>)

  const dates = Object.keys(sessionsByDate)
  const today = new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white hover:bg-white/20"
            >
              <Link href={`/${businessSlug}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-white/90 max-w-2xl mx-auto">{product.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Date Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Select a date</h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {dates.slice(0, 7).map((dateStr) => {
              const date = new Date(dateStr)
              const isToday = date.toDateString() === today.toDateString()
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNum = date.getDate()
              const month = date.toLocaleDateString('en-US', { month: 'short' })

              return (
                <Card
                  key={dateStr}
                  className={`flex-shrink-0 cursor-pointer transition-colors ${
                    isToday ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-100'
                  }`}
                >
                  <CardContent className="p-3 text-center min-w-[80px]">
                    {isToday ? (
                      <div className="font-semibold">Today</div>
                    ) : (
                      <div className="font-medium">{dayName}</div>
                    )}
                    <div className="text-lg font-bold">{dayNum}</div>
                    <div className="text-sm text-gray-600">{month}</div>
                  </CardContent>
                </Card>
              )
            })}
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a time</h2>

          {dates.length > 0 ? (
            <div className="space-y-6">
              {dates.slice(0, 1).map((dateStr) => ( // Show first date for now
                <div key={dateStr}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sessionsByDate[dateStr].slice(0, 6).map((session) => {
                      const timeStr = session.startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })

                      const availableSpots = session.maxCapacity - session.bookedCapacity
                      const isAvailable = availableSpots > 0

                      return (
                        <Button
                          key={session.id}
                          variant={isAvailable ? "outline" : "secondary"}
                          disabled={!isAvailable}
                          asChild={isAvailable}
                          className="h-12 text-base"
                        >
                          {isAvailable ? (
                            <Link href={`/${businessSlug}/book/${productSlug}/${session.id}`}>
                              {timeStr}
                            </Link>
                          ) : (
                            <span>{timeStr} (Full)</span>
                          )}
                        </Button>
                      )
                    })}
                  </div>

                  {sessionsByDate[dateStr].length > 6 && (
                    <Button variant="ghost" className="w-full mt-3">
                      Show more times
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No available time slots for this product.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}