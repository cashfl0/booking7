import { NextRequest, NextResponse } from 'next/server'
import { EmailParser, type SendGridInboundWebhook } from '@/lib/email-parser'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Received inbound email webhook')

    // Verify SendGrid webhook signature if configured
    if (process.env.SENDGRID_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-twilio-email-event-webhook-signature')
      const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp')

      if (!signature || !timestamp) {
        console.warn('Missing SendGrid webhook signature headers')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      // Verify the webhook signature
      const body = await request.text()
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SENDGRID_WEBHOOK_SECRET)
        .update(timestamp + body)
        .digest('base64')

      if (signature !== expectedSignature) {
        console.warn('Invalid SendGrid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      // Re-parse the body as form data since we consumed it for signature verification
      const formData = new URLSearchParams(body)
      const webhookData: SendGridInboundWebhook = {
        to: formData.get('to') || '',
        from: formData.get('from') || '',
        subject: formData.get('subject') || '',
        text: formData.get('text') || '',
        html: formData.get('html') || undefined,
        attachments: formData.get('attachments') || undefined,
        attachment_count: formData.get('attachment_count') || undefined,
      }

      console.log('✅ SendGrid webhook signature verified')
      await processInboundEmail(webhookData)
    } else {
      // For development/testing without signature verification
      const formData = await request.formData()
      const webhookData: SendGridInboundWebhook = {
        to: formData.get('to')?.toString() || '',
        from: formData.get('from')?.toString() || '',
        subject: formData.get('subject')?.toString() || '',
        text: formData.get('text')?.toString() || '',
        html: formData.get('html')?.toString() || undefined,
        attachments: formData.get('attachments')?.toString() || undefined,
        attachment_count: formData.get('attachment_count')?.toString() || undefined,
      }

      console.log('⚠️ Processing webhook without signature verification (development mode)')
      await processInboundEmail(webhookData)
    }

    return NextResponse.json({ status: 'success' })

  } catch (error) {
    console.error('❌ Error processing inbound email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processInboundEmail(webhookData: SendGridInboundWebhook) {
  console.log('📨 Processing inbound email:', {
    to: webhookData.to,
    from: webhookData.from,
    subject: webhookData.subject,
    textLength: webhookData.text?.length,
    textPreview: webhookData.text?.substring(0, 100) + '...',
    hasHtml: !!webhookData.html,
    attachmentCount: webhookData.attachment_count
  })

  // Parse the inbound email
  const parsedEmail = await EmailParser.parseInboundEmail(webhookData)
  if (!parsedEmail) {
    console.warn('❌ Failed to parse inbound email')
    return
  }

  console.log('📋 Parsed email:', {
    businessSlug: parsedEmail.businessSlug,
    bookingId: parsedEmail.bookingId,
    fromEmail: parsedEmail.fromEmail,
    fromName: parsedEmail.fromName,
    contentLength: parsedEmail.textContent.length
  })

  // Validate the booking exists and get the business info
  const booking = await EmailParser.validateBooking(parsedEmail.businessSlug, parsedEmail.bookingId)
  if (!booking) {
    console.warn('❌ Invalid booking or business:', {
      businessSlug: parsedEmail.businessSlug,
      bookingId: parsedEmail.bookingId
    })

    // TODO: Send auto-reply to customer about invalid booking reference
    return
  }

  console.log('✅ Validated booking:', {
    bookingId: booking.id,
    guestEmail: booking.guest.email,
    businessName: booking.session.event.experience.business.name
  })

  // Verify the sender is the booking guest
  if (booking.guest.email.toLowerCase() !== parsedEmail.fromEmail.toLowerCase()) {
    console.warn('❌ Email sender does not match booking guest:', {
      bookingGuestEmail: booking.guest.email,
      senderEmail: parsedEmail.fromEmail
    })

    // TODO: Send auto-reply about unauthorized sender
    return
  }

  // Create communication record in database
  try {
    console.log('💾 About to save to database:', {
      bookingId: booking.id,
      subject: parsedEmail.subject,
      contentLength: parsedEmail.textContent.length,
      contentPreview: parsedEmail.textContent.substring(0, 100) + '...',
      fromAddress: parsedEmail.fromEmail
    })

    const communication = await prisma.bookingCommunication.create({
      data: {
        bookingId: booking.id,
        type: 'CUSTOMER_REPLY',
        channel: 'EMAIL',
        direction: 'INBOUND',
        status: 'RECEIVED',
        subject: parsedEmail.subject,
        content: parsedEmail.textContent,
        fromAddress: parsedEmail.fromEmail,
        toAddress: webhookData.to,
        receivedAt: new Date(),
      }
    })

    console.log('✅ Created communication record:', communication.id)

    // TODO: Optional - Send notification to business owner about new customer reply
    // TODO: Optional - Handle attachments if present

  } catch (dbError) {
    console.error('❌ Failed to create communication record:', dbError)
    throw dbError
  }
}