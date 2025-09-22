'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Mail, Send, AlertCircle, CheckCircle, Clock, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Communication {
  id: string
  type: 'CONFIRMATION' | 'REMINDER_24H' | 'REMINDER_1H' | 'CANCELLATION' | 'WAIVER_REQUEST' | 'MARKETING' | 'CUSTOMER_REPLY' | 'CUSTOMER_INQUIRY'
  channel: 'EMAIL' | 'SMS' | 'PUSH'
  direction: 'OUTBOUND' | 'INBOUND'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'RECEIVED'
  subject?: string
  content?: string
  fromAddress?: string
  toAddress?: string
  sentAt?: string
  deliveredAt?: string
  receivedAt?: string
  errorMessage?: string
  messageId?: string
  createdAt: string
  updatedAt: string
}

interface CommunicationHistoryProps {
  bookingId: string
  refreshTrigger?: number
}

export function CommunicationHistory({ bookingId, refreshTrigger }: CommunicationHistoryProps) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCommunications()
  }, [bookingId, refreshTrigger])

  const fetchCommunications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${bookingId}/communications`)

      if (!response.ok) {
        throw new Error('Failed to fetch communications')
      }

      const data = await response.json()
      setCommunications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communications')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="w-4 h-4" />
      case 'SMS':
        return <Phone className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
      case 'BOUNCED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Send className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'default'
      case 'FAILED':
      case 'BOUNCED':
        return 'destructive'
      case 'PENDING':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CONFIRMATION':
        return 'Booking Confirmation'
      case 'REMINDER_24H':
        return '24 Hour Reminder'
      case 'REMINDER_1H':
        return '1 Hour Reminder'
      case 'CANCELLATION':
        return 'Cancellation'
      case 'WAIVER_REQUEST':
        return 'Waiver Request'
      case 'MARKETING':
        return 'Marketing'
      case 'CUSTOMER_REPLY':
        return 'Customer Reply'
      case 'CUSTOMER_INQUIRY':
        return 'Customer Inquiry'
      default:
        return type
    }
  }

  const getDirectionBadge = (direction: string) => {
    return direction === 'OUTBOUND' ? (
      <Badge variant="outline" className="text-xs">
        <Send className="w-3 h-3 mr-1" />
        Sent
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        <MessageSquare className="w-3 h-3 mr-1" />
        Received
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCommunications} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Communication History
          {communications.length > 0 && (
            <Badge variant="secondary">{communications.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No communications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Emails and messages will appear here once sent
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {communications.map((comm) => {
              const isExpanded = expandedItems.has(comm.id)
              const hasContent = comm.content && comm.content.length > 0

              return (
                <div
                  key={comm.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        {getChannelIcon(comm.channel)}
                        {getStatusIcon(comm.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{getTypeLabel(comm.type)}</h4>
                          {getDirectionBadge(comm.direction)}
                          <Badge variant={getStatusVariant(comm.status)}>
                            {comm.status}
                          </Badge>
                        </div>

                        {comm.subject && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {comm.subject}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {comm.sentAt
                              ? `Sent ${formatDistanceToNow(new Date(comm.sentAt), { addSuffix: true })}`
                              : `Created ${formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}`
                            }
                          </span>
                          {comm.direction === 'OUTBOUND' && comm.toAddress && (
                            <span>to {comm.toAddress}</span>
                          )}
                          {comm.direction === 'INBOUND' && comm.fromAddress && (
                            <span>from {comm.fromAddress}</span>
                          )}
                        </div>

                        {comm.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {comm.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    {hasContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(comm.id)}
                        className="ml-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {hasContent && isExpanded && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-sm whitespace-pre-wrap">{comm.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}