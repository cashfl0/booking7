'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Mail, Phone, Calendar, Package } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { GuestDetailModal } from './guest-detail-modal'

// Guest detail interface for the modal
interface GuestForModal {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  _count: {
    bookings: number
  }
  bookings?: Array<{
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    total: number
    session: {
      event: {
        name: string
        experience: {
          name: string
        }
      }
    }
  }>
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  _count: {
    bookings: number
  }
  bookings: Array<{
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    total: number
    session: {
      event: {
        name: string
        experience: {
          name: string
        }
      }
    }
  }>
}

interface Experience {
  id: string
  name: string
}

interface Event {
  id: string
  name: string
  experienceId: string
}

interface GuestsPageClientProps {
  initialGuests: Guest[]
  totalCount: number
  currentPage: number
  experiences: Experience[]
  events: Event[]
}

export function GuestsPageClient({
  initialGuests,
  totalCount,
  currentPage
}: GuestsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedGuest, setSelectedGuest] = useState<GuestForModal | null>(null)

  const guestsPerPage = 50
  const totalPages = Math.ceil(totalCount / guestsPerPage)

  const handleSearch = async (search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) {
      params.set('search', search)
    }
    params.set('page', '1')

    router.push(`/dashboard/guests?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchTerm) {
      params.set('search', searchTerm)
    }
    params.set('page', page.toString())

    router.push(`/dashboard/guests?${params.toString()}`)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CANCELLED':
        return 'destructive'
      case 'COMPLETED':
        return 'outline'
      default:
        return 'default'
    }
  }

  useEffect(() => {
    setLoading(false)
    setGuests(initialGuests)
  }, [initialGuests])

  const handleGuestClick = (guest: Guest) => {
    // Transform guest to match GuestForModal interface for the modal
    const guestDetail: GuestForModal = {
      ...guest,
      bookings: guest.bookings || []
    }
    setSelectedGuest(guestDetail)
  }

  const handleGuestModalClose = () => {
    setSelectedGuest(null)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8" />
            Guests
          </h1>
          <p className="text-muted-foreground">
            Manage your customer database and booking history
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {totalCount} guest{totalCount !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Guests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, phone, or booking IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchTerm)
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => handleSearch(searchTerm)}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  handleSearch('')
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Search by name, email, phone number, experience ID, event ID, session ID, or booking ID
          </p>
        </CardContent>
      </Card>

      {/* Guests List */}
      {guests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No guests found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'No guests match your search criteria.'
                : 'No guests have made bookings yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {guests.map((guest) => (
            <Card key={guest.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleGuestClick(guest)}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Guest Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {guest.firstName} {guest.lastName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            #{guest.id.slice(-8)}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {guest.email}
                          </div>
                          {guest.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {guest.phone}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Joined {formatDistanceToNow(new Date(guest.createdAt), { addSuffix: true })}
                          </span>
                          <span>
                            {guest._count.bookings} booking{guest._count.bookings !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  {guest.bookings.length > 0 && (
                    <div className="lg:w-96">
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Recent Bookings
                      </h4>
                      <div className="space-y-2">
                        {guest.bookings.slice(0, 2).map((booking) => (
                          <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                                {booking.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                #{booking.id.slice(-8)}
                              </span>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">{booking.session.event.name}</p>
                              <p className="text-gray-600 text-xs">
                                {booking.session.event.experience.name}
                              </p>
                              <p className="text-gray-600 text-xs flex items-center gap-1 mt-1">
                                <Package className="w-3 h-3" />
                                ${booking.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {guest.bookings.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{guest.bookings.length - 2} more booking{guest.bookings.length - 2 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {guests.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * guestsPerPage) + 1} to {Math.min(currentPage * guestsPerPage, totalCount)} of {totalCount} guests
          </p>
        </div>
      )}

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <GuestDetailModal
          guest={selectedGuest}
          onClose={handleGuestModalClose}
        />
      )}
    </div>
  )
}