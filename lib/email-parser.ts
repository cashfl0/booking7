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
  email?: string  // Raw MIME email
  // SendGrid includes many other fields, but these are the ones we need
}

export class EmailParser {
  /**
   * Extract text content from raw MIME email
   */
  static extractTextFromRawEmail(rawEmail: string): string {
    try {
      console.log('📧 Extracting text from raw email, length:', rawEmail.length)

      // Debug: Show first 1000 chars to understand structure better
      console.log('📧 Raw email preview (first 1000 chars):', rawEmail.substring(0, 1000))

      // Strategy 1: Skip email headers and look for actual message content
      // First, find where headers end (after the last header line before a blank line)
      const lines = rawEmail.split('\n')
      let messageStartIndex = -1

      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].trim()
        const nextLine = lines[i + 1].trim()

        // Look for transition from headers to message body (blank line after headers)
        if (currentLine.length > 0 &&
            (currentLine.match(/^[A-Za-z-]+:\s/) || currentLine.match(/^\s+/)) && // Header line or continuation
            nextLine === '') { // Followed by blank line
          messageStartIndex = i + 2 // Start after the blank line
          console.log('📧 Found message start at line:', messageStartIndex)
          break
        }
      }

      if (messageStartIndex > 0 && messageStartIndex < lines.length) {
        // Extract content from message start
        const messageLines = lines.slice(messageStartIndex)
        const messageContent = messageLines.join('\n')

        // Look for patterns in the actual message content
        const patterns = [
          // Pattern 1: Content before "On <date>" or reply patterns
          /^([^]*?)(?=\n\s*On\s+.*?wrote:|From:\s|Sent:\s)/im,
          // Pattern 2: Content before quoted sections (>)
          /^([^]*?)(?=\n\s*>)/m,
          // Pattern 3: Content before reply separators
          /^([^]*?)(?=\n\s*_{10,}|\n\s*-{10,})/m,
          // Pattern 4: Just take first few non-empty lines
          /^([^\n]*(?:\n[^\n]*){0,5})/m
        ]

        for (const pattern of patterns) {
          const match = messageContent.match(pattern)
          if (match && match[1]) {
            const content = match[1].trim()
            // Only consider it valid if it has meaningful content (not headers)
            if (content.length > 2 &&
                !content.match(/^(Received:|DKIM-Signature:|X-Google|X-Gm|Content-Type:|Content-Transfer-Encoding:|MIME-Version:)/i)) {
              console.log('📧 Extracted using pattern match:', content.substring(0, 200))
              return this.cleanReplyContent(content)
            }
          }
        }
      }

      // Strategy 2: Look for Content-Type: text/plain sections
      const textPlainMatches = rawEmail.split(/Content-Type:\s*text\/plain/i)
      if (textPlainMatches.length > 1) {
        console.log('📧 Found text/plain section')
        // Get everything after the first text/plain header
        const afterTextPlain = textPlainMatches[1]

        // Debug: Show more context around text/plain section
        console.log('📧 Content after text/plain (first 800 chars):', afterTextPlain.substring(0, 800))

        // Try multiple content extraction patterns
        const contentPatterns = [
          // Pattern 1: Content after headers until boundary
          /\n\n([^]*?)(?=\n--\w|Content-Type:|$)/i,
          // Pattern 2: Content after charset until boundary
          /charset[^]*?\n\n([^]*?)(?=\n--\w|Content-Type:|$)/i,
          // Pattern 3: Just grab everything after double newline
          /\n\n([^]*?)$/i
        ]

        for (const pattern of contentPatterns) {
          const contentMatch = afterTextPlain.match(pattern)
          if (contentMatch && contentMatch[1]) {
            const content = contentMatch[1].trim()
            if (content.length > 0) {
              console.log('📧 Extracted from text/plain with pattern:', content.substring(0, 200))
              return this.cleanReplyContent(content)
            }
          }
        }
      }

      // Strategy 3: Look for simple email pattern (blank line followed by content)
      const emailLines = rawEmail.split('\n')
      let foundBlankLine = false
      const contentLines: string[] = []

      for (let i = 0; i < emailLines.length; i++) {
        if (!foundBlankLine) {
          // Look for blank line (end of headers)
          if (emailLines[i].trim() === '') {
            foundBlankLine = true
            continue
          }
        } else {
          // After blank line, collect content until we hit boundaries
          const line = emailLines[i]
          if (line.startsWith('--') || line.startsWith('Content-Type:') || line.match(/^From:|^Date:|^To:|^Subject:/)) {
            break
          }
          contentLines.push(line)
        }
      }

      if (contentLines.length > 0) {
        const content = contentLines.join('\n').trim()
        console.log('📧 Extracted from simple parsing:', content.substring(0, 100))
        return this.cleanReplyContent(content)
      }

      // Strategy 4: Last resort - search for any line that looks like user content
      const userContentPattern = /^[^>:\n]*\b(test\d+|thank you|thanks|yes|no|please|help|question)\b[^>:\n]*$/im
      const userContentMatch = rawEmail.match(userContentPattern)
      if (userContentMatch) {
        console.log('📧 Found potential user content with pattern match:', userContentMatch[0])
        return userContentMatch[0].trim()
      }

      console.warn('📧 Could not extract text content from raw email')
      return ''
    } catch (error) {
      console.error('📧 Error extracting text from raw email:', error)
      return ''
    }
  }

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

    // Remove common email headers at the beginning
    cleanContent = cleanContent.replace(/^(Content-Type:|Content-Transfer-Encoding:|MIME-Version:|Content-Disposition:)[^\n]*\n/gim, '')

    // Split by common separators and take first part (most important step)
    const separators = [
      '\n-----Original Message-----',
      '\n________________________________',
      '\n________________________________',
      '\nFrom:',
      '\nOn ',
      '\nSent:',
      '\nDate:',
      '\n\n>',  // Quoted content marker
      '\n> '   // Another quoted content marker
    ]

    for (const separator of separators) {
      const separatorIndex = cleanContent.indexOf(separator)
      if (separatorIndex > 0) {
        console.log(`🧹 Found separator "${separator}" at position ${separatorIndex}`)
        cleanContent = cleanContent.substring(0, separatorIndex)
        break
      }
    }

    // Remove lines that start with > (quoted content) or are email headers
    const lines = cleanContent.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim()
      // Keep lines that don't start with > and aren't email headers
      return !trimmedLine.startsWith('>') &&
             !trimmedLine.startsWith('From:') &&
             !trimmedLine.startsWith('To:') &&
             !trimmedLine.startsWith('Date:') &&
             !trimmedLine.startsWith('Subject:') &&
             !trimmedLine.startsWith('Content-Type:') &&
             !trimmedLine.startsWith('Content-Transfer-Encoding:') &&
             !trimmedLine.startsWith('MIME-Version:') &&
             !trimmedLine.startsWith('Content-Disposition:') &&
             !trimmedLine.startsWith('Received:') &&
             !trimmedLine.startsWith('DKIM-Signature:') &&
             !trimmedLine.startsWith('X-Google') &&
             !trimmedLine.startsWith('X-Gm') &&
             !trimmedLine.startsWith('X-Received:') &&
             !trimmedLine.startsWith('References:') &&
             !trimmedLine.startsWith('In-Reply-To:') &&
             !trimmedLine.match(/^[A-Za-z-]+:\s/) && // Generic header pattern
             trimmedLine !== '' // Remove empty lines unless they're the only content
    })

    // Join and trim again
    let result = filteredLines.join('\n').trim()

    // If result is still empty or very short, try to find any meaningful text
    if (result.length < 3) {
      // Look for any line in the original content that contains actual text (not headers)
      const allLines = content.split('\n')
      for (const line of allLines) {
        const trimmedLine = line.trim()
        if (trimmedLine.length > 2 &&
            !trimmedLine.match(/^(Content-Type:|Content-Transfer-Encoding:|MIME-Version:|Content-Disposition:|From:|To:|Date:|Subject:|>)/i) &&
            trimmedLine.match(/[a-zA-Z]/) && // Contains letters
            !trimmedLine.match(/^[=-]{3,}/) // Not a separator line
        ) {
          result = trimmedLine
          console.log('🧹 Found meaningful content in fallback search:', result)
          break
        }
      }
    }

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

      // Get text content - try multiple sources in order of preference
      let rawTextContent = webhookData.text || ''

      // If no text content but we have HTML, try to extract text from HTML
      if (!rawTextContent && webhookData.html) {
        console.log('📧 No text content, attempting to extract from HTML')
        rawTextContent = webhookData.html
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
          .replace(/&amp;/g, '&')  // Replace &amp; with &
          .replace(/&lt;/g, '<')   // Replace &lt; with <
          .replace(/&gt;/g, '>')   // Replace &gt; with >
      }

      // If still no content, try to extract from raw email
      if (!rawTextContent && webhookData.email) {
        console.log('📧 No text/html content, attempting to extract from raw email')
        rawTextContent = this.extractTextFromRawEmail(webhookData.email)
      }

      console.log('📧 Raw content before cleaning:', {
        hasText: !!webhookData.text,
        hasHtml: !!webhookData.html,
        hasEmail: !!webhookData.email,
        textLength: webhookData.text?.length || 0,
        htmlLength: webhookData.html?.length || 0,
        emailLength: webhookData.email?.length || 0,
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