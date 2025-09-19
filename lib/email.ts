import sgMail from '@sendgrid/mail'
import { generateBookingConfirmationTemplate } from './email_templates'

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

    const msg = {
      to: options.to,
      from: {
        email: this.config!.fromEmail,
        name: this.config!.fromName
      },
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    }

    console.log('🚀 SendGrid message payload:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      htmlLength: msg.html?.length,
      textLength: msg.text?.length,
      hasAttachments: !!msg.attachments?.length,
      htmlContainsImages: msg.html?.includes('<img') || false,
      htmlContainsDataUrls: msg.html?.includes('data:image/') || false,
      htmlContainsImageUrls: msg.html?.includes('/qr-codes/') || false
    })

    try {
      console.log('📨 Calling SendGrid API...')
      const response = await sgMail.send(msg)
      console.log('🎉 SendGrid response:', {
        statusCode: response[0]?.statusCode,
        headers: response[0]?.headers ? Object.keys(response[0].headers) : []
      })
    } catch (error) {
      console.error('❌ SendGrid email error:', error)
      console.error('📋 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as Record<string, unknown>)?.code,
        response: (error as Record<string, unknown>)?.response
      })
      throw new Error('Failed to send email')
    }
  }

  generateBookingConfirmationEmail(data: BookingEmailData): EmailTemplate {
    return generateBookingConfirmationTemplate(data)
  }
}

// Export singleton instance
export const emailService = new EmailService()