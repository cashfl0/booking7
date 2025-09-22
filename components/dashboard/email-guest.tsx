'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Send, AlertCircle } from 'lucide-react'

interface EmailGuestProps {
  bookingId: string
  guestEmail: string
  guestName: string
  onEmailSent?: () => void
}

export function EmailGuest({ bookingId, guestEmail, guestName, onEmailSent }: EmailGuestProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
          recipientEmail: guestEmail,
          recipientName: guestName
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      // Reset form
      setFormData({ subject: '', message: '' })
      setIsOpen(false)

      // Notify parent component
      if (onEmailSent) {
        onEmailSent()
      }

    } catch (error) {
      console.error('Error sending email:', error)
      setError(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ subject: '', message: '' })
    setError(null)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Mail className="w-4 h-4 mr-2" />
        Email Guest
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Send Email to Guest
        </CardTitle>
        <CardDescription>
          Send a custom email to {guestName} ({guestEmail})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email subject"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Type your message here..."
              rows={6}
              required
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isLoading || !formData.subject.trim() || !formData.message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}