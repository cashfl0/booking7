import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'

interface Props {
  params: Promise<{ id: string }>
}

interface SendEmailRequest {
  subject: string
  message: string
  recipientEmail: string
  recipientName: string
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data: SendEmailRequest = await request.json()

    // Validate required fields
    if (!data.subject || !data.message || !data.recipientEmail) {
      return NextResponse.json(
        { error: 'Subject, message, and recipient email are required' },
        { status: 400 }
      )
    }

    // Verify booking belongs to the user's business
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        session: {
          event: {
            experience: {
              businessId: session.user.businessId
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify the recipient email matches the booking guest
    if (booking.guest.email !== data.recipientEmail) {
      return NextResponse.json({ error: 'Email recipient must match booking guest' }, { status: 400 })
    }

    // Initialize email service
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    emailService.initialize({
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME || booking.session.event.experience.business.name
    })

    // Create email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .content {
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Message from ${booking.session.event.experience.business.name}</h2>
          <p>Regarding your booking for: ${booking.session.event.experience.name}</p>
        </div>

        <div class="content">${data.message}</div>

        <div class="footer">
          <p>This email was sent regarding your booking #${booking.id.slice(-8)}.</p>
          <p>If you have any questions, please reply to this email.</p>
        </div>
      </body>
      </html>
    `

    // Create plain text version
    const textContent = `
Message from ${booking.session.event.experience.business.name}

Regarding your booking for: ${booking.session.event.experience.name}

${data.message}

---
This email was sent regarding your booking #${booking.id.slice(-8)}.
If you have any questions, please reply to this email.
    `.trim()

    // Send email
    await emailService.sendEmail({
      to: data.recipientEmail,
      subject: data.subject,
      html: htmlContent,
      text: textContent,
      bookingId: booking.id,
      businessSlug: booking.session.event.experience.business.slug,
      communicationType: 'MARKETING' // Using MARKETING as the closest type for custom messages
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Error sending email to guest:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}