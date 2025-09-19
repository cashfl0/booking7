'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Business, Experience, Event, Session, GuestForm, BookingConfirmation } from '../types/booking-types'

interface BookingConfirmationProps {
  business: Business
  experience: Experience
  event: Event
  selectedSession: Session
  guestForm: GuestForm
  totalPrice: number
  ticketQuantity: number
  confirmationData: BookingConfirmation | null
}

export function BookingConfirmationComponent({
  business,
  experience,
  event,
  selectedSession,
  guestForm,
  totalPrice,
  ticketQuantity,
  confirmationData
}: BookingConfirmationProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/book/${business.slug}/${experience.slug}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {experience.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
          <p className="text-lg text-gray-600">{event.name}</p>
        </div>

        {/* Booking Confirmation */}
        <div id="confirmation-section" className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your booking has been successfully processed.</p>

            {/* Booking Details */}
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Experience:</span> {event.name}</p>
                <p><span className="font-medium">Date & Time:</span> {format(new Date(selectedSession.startTime), 'EEEE, MMMM d, yyyy')} at {format(new Date(selectedSession.startTime), 'h:mm a')}</p>
                <p><span className="font-medium">Tickets:</span> {ticketQuantity}</p>
                <p><span className="font-medium">Total:</span> ${totalPrice.toFixed(2)}</p>
                {confirmationData?.bookingId && (
                  <p><span className="font-medium">Booking ID:</span> {confirmationData.bookingId}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {guestForm.firstName} {guestForm.lastName}</p>
                <p><span className="font-medium">Email:</span> {guestForm.email}</p>
                {guestForm.phone && <p><span className="font-medium">Phone:</span> {guestForm.phone}</p>}
              </div>
            </div>

            <p className="text-sm text-gray-600">
              A confirmation email has been sent to {guestForm.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}