import { prisma } from './prisma'

export interface ParsedInboundEmail {
  businessSlug: string
  bookingId: string
  fromEmail: string
  fromName?: string
  subject: string
  textContent: string
  htmlContent?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export interface SendGridInboundWebhook {
  to: string
  from: string
  subject: string
  text: string
  html?: string
  attachments?: string
  attachment_count?: string
  // SendGrid includes many other fields, but these are the ones we need
}

export class EmailParser {
  /**
   * Parse the reply-to address to extract business slug and booking ID
   * Format: {business-slug}+{booking-id}@ticketup.ai
   */
  static parseReplyToAddress(toAddress: string): { businessSlug: string; bookingId: string } | null {
    try {
      // Remove domain part and get local part
      const localPart = toAddress.split('@')[0]

      // Split on + to get business slug and booking ID
      const parts = localPart.split('+')

      if (parts.length !== 2) {
        console.warn('Invalid reply-to format:', toAddress)
        return null
      }

      const [businessSlug, bookingId] = parts

      if (!businessSlug || !bookingId) {
        console.warn('Missing business slug or booking ID:', toAddress)
        return null
      }

      return { businessSlug, bookingId }
    } catch (error) {
      console.error('Error parsing reply-to address:', error)
      return null
    }
  }

  /**
   * Clean reply content by removing quoted text and signatures
   */
  static cleanReplyContent(content: string): string {
    console.log('🧹 Original content length:', content.length)
    console.log('🧹 Original content preview:', content.substring(0, 200) + '...')

    if (!content || content.trim().length === 0) {
      console.warn('⚠️ Empty content received')
      return ''
    }

    let cleanContent = content.trim()

    // Split by common separators and take first part (most important step)
    const separators = [
      '\n-----Original Message-----',
      '\n________________________________',
      '\nFrom:',
      '\nOn '
    ]

    for (const separator of separators) {
      const separatorIndex = cleanContent.indexOf(separator)
      if (separatorIndex > 0) {
        console.log(`🧹 Found separator "${separator}" at position ${separatorIndex}`)
        cleanContent = cleanContent.substring(0, separatorIndex)
        break
      }
    }

    // Remove lines that start with > (quoted content)
    const lines = cleanContent.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim()
      // Keep lines that don't start with > and aren't email headers
      return !trimmedLine.startsWith('>') &&
             !trimmedLine.startsWith('From:') &&
             !trimmedLine.startsWith('To:') &&
             !trimmedLine.startsWith('Date:') &&
             !trimmedLine.startsWith('Subject:')
    })

    const result = filteredLines.join('\n').trim()

    console.log('🧹 Cleaned content length:', result.length)
    console.log('🧹 Cleaned content preview:', result.substring(0, 200) + '...')

    return result
  }

  /**
   * Validate that the booking exists and belongs to the business
   */
  static async validateBooking(businessSlug: string, bookingId: string) {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          session: {
            event: {
              experience: {
                business: {
                  slug: businessSlug
                }
              }
            }
          }
        },
        include: {
          guest: true,
          session: {
            include: {
              event: {
                include: {
                  experience: {
                    include: {
                      business: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      return booking
    } catch (error) {
      console.error('Error validating booking:', error)
      return null
    }
  }

  /**
   * Parse SendGrid inbound webhook payload
   */
  static async parseInboundEmail(webhookData: SendGridInboundWebhook): Promise<ParsedInboundEmail | null> {
    try {
      // Parse the to address to get business and booking info
      const addressInfo = this.parseReplyToAddress(webhookData.to)
      if (!addressInfo) {
        return null
      }

      // Extract sender information
      const fromMatch = webhookData.from.match(/^(.*?)\s*<(.+)>$/) || [null, null, webhookData.from]
      const fromName = fromMatch[1]?.trim() || undefined
      const fromEmail = fromMatch[2]?.trim() || webhookData.from

      // Get text content - prefer text, fall back to HTML if text is empty
      let rawTextContent = webhookData.text || ''

      // If no text content but we have HTML, try to extract text from HTML
      if (!rawTextContent && webhookData.html) {
        console.log('📧 No text content, attempting to extract from HTML')
        // Simple HTML to text conversion (remove tags)
        rawTextContent = webhookData.html
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
          .replace(/&amp;/g, '&')  // Replace &amp; with &
          .replace(/&lt;/g, '<')   // Replace &lt; with <
          .replace(/&gt;/g, '>')   // Replace &gt; with >
      }

      console.log('📧 Raw content before cleaning:', {
        hasText: !!webhookData.text,
        hasHtml: !!webhookData.html,
        textLength: webhookData.text?.length || 0,
        htmlLength: webhookData.html?.length || 0,
        finalRawLength: rawTextContent.length
      })

      // Clean the reply content
      const cleanTextContent = this.cleanReplyContent(rawTextContent)

      // Parse attachments if present
      let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined
      if (webhookData.attachments && parseInt(webhookData.attachment_count || '0') > 0) {
        // SendGrid sends attachments as JSON string
        try {
          const attachmentData = JSON.parse(webhookData.attachments) as Record<string, { content: string; type?: string }>
          attachments = Object.entries(attachmentData).map(([filename, data]) => ({
            filename,
            content: Buffer.from(data.content, 'base64'),
            contentType: data.type || 'application/octet-stream'
          }))
        } catch (attachmentError) {
          console.warn('Failed to parse attachments:', attachmentError)
        }
      }

      return {
        businessSlug: addressInfo.businessSlug,
        bookingId: addressInfo.bookingId,
        fromEmail,
        fromName,
        subject: webhookData.subject || '(No Subject)',
        textContent: cleanTextContent,
        htmlContent: webhookData.html,
        attachments
      }
    } catch (error) {
      console.error('Error parsing inbound email:', error)
      return null
    }
  }
}