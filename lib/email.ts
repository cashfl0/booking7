import sgMail from '@sendgrid/mail'
import { generateBookingConfirmationTemplate } from './email_templates'
import { prisma } from './prisma'

// TypeScript interfaces following CLAUDE.md guidelines
export interface EmailConfig {
  apiKey: string
  fromEmail: string
  fromName: string
}

export interface BookingEmailData {
  guest: {
    firstName: string
    lastName: string
    email: string
  }
  booking: {
    id: string
    quantity: number
    total: number
    createdAt: string
  }
  session: {
    startTime: string
    endTime: string
  }
  event: {
    name: string
    description?: string | null
  }
  experience: {
    name: string
  }
  business: {
    name: string
    slug: string
  }
  qrCodeUrl?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  attachments?: Array<{
    content: string
    filename: string
    type: string
    disposition: string
    content_id?: string
  }>
  // Optional tracking parameters
  bookingId?: string
  communicationType?: 'CONFIRMATION' | 'REMINDER_24H' | 'REMINDER_1H' | 'CANCELLATION' | 'WAIVER_REQUEST' | 'MARKETING'
  // Optional reply-to for inbound email routing
  replyTo?: string
  businessSlug?: string
}

class EmailService {
  private config: EmailConfig | null = null

  initialize(config: EmailConfig): void {
    this.config = config
    sgMail.setApiKey(config.apiKey)
  }

  private ensureInitialized(): void {
    if (!this.config) {
      throw new Error('EmailService not initialized. Call initialize() first.')
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    this.ensureInitialized()

    // Generate reply-to address if booking info is provided
    let replyToAddress = options.replyTo
    if (!replyToAddress && options.bookingId && options.businessSlug) {
      replyToAddress = `${options.businessSlug}+${options.bookingId}@ticketup.ai`
    }

    const msg = {
      to: options.to,
      from: {
        email: this.config!.fromEmail,
        name: this.config!.fromName
      },
      replyTo: replyToAddress,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    }

    console.log('🚀 SendGrid message payload:', {
      to: msg.to,
      from: msg.from,
      replyTo: msg.replyTo,
      subject: msg.subject,
      htmlLength: msg.html?.length,
      textLength: msg.text?.length,
      hasAttachments: !!msg.attachments?.length,
      htmlContainsImages: msg.html?.includes('<img') || false,
      htmlContainsDataUrls: msg.html?.includes('data:image/') || false,
      htmlContainsImageUrls: msg.html?.includes('/qr-codes/') || false,
      bookingId: options.bookingId,
      businessSlug: options.businessSlug,
      communicationType: options.communicationType
    })

    // Create database record before sending
    let communicationId: string | null = null
    if (options.bookingId && options.communicationType) {
      try {
        const communication = await prisma.bookingCommunication.create({
          data: {
            bookingId: options.bookingId,
            type: options.communicationType,
            channel: 'EMAIL',
            direction: 'OUTBOUND',
            status: 'PENDING',
            subject: options.subject,
            content: options.text, // Store text version for searchability
            fromAddress: this.config!.fromEmail,
            toAddress: options.to,
          }
        })
        communicationId = communication.id
        console.log('📝 Created communication record:', communication.id)
      } catch (dbError) {
        console.error('❌ Failed to create communication record:', dbError)
        // Continue with email sending even if DB tracking fails
      }
    }

    try {
      console.log('📨 Calling SendGrid API...')
      const response = await sgMail.send(msg)
      console.log('🎉 SendGrid response:', {
        statusCode: response[0]?.statusCode,
        headers: response[0]?.headers ? Object.keys(response[0].headers) : []
      })

      // Update communication record with success status
      if (communicationId) {
        try {
          await prisma.bookingCommunication.update({
            where: { id: communicationId },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              messageId: response[0]?.headers?.['x-message-id'] as string || null
            }
          })
          console.log('✅ Updated communication record as SENT')
        } catch (updateError) {
          console.error('❌ Failed to update communication status:', updateError)
        }
      }

    } catch (error) {
      console.error('❌ SendGrid email error:', error)
      console.error('📋 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as Record<string, unknown>)?.code,
        response: (error as Record<string, unknown>)?.response
      })

      // Update communication record with failure status
      if (communicationId) {
        try {
          await prisma.bookingCommunication.update({
            where: { id: communicationId },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          console.log('📝 Updated communication record as FAILED')
        } catch (updateError) {
          console.error('❌ Failed to update communication failure status:', updateError)
        }
      }

      throw new Error('Failed to send email')
    }
  }

  generateBookingConfirmationEmail(data: BookingEmailData): EmailTemplate {
    return generateBookingConfirmationTemplate(data)
  }
}

// Export singleton instance
export const emailService = new EmailService()