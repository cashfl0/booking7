import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService, type BookingEmailData } from '@/lib/email'

interface ProcessPaymentRequest {
  guest: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    marketingOptIn: boolean
    termsAccepted: boolean
    businessId: string
  }
  booking: {
    sessionId: string
    quantity: number
    total: number
    items: Array<{
      quantity: number
      unitPrice: number
      totalPrice: number
      itemType: 'SESSION' | 'ADD_ON'
      addOnId?: string | null
    }>
  }
  payment?: {
    cardNumber: string
    expiryDate: string
    cvv: string
    nameOnCard: string
    billingZip: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ProcessPaymentRequest = await request.json()

    // Validate required fields
    if (!data.guest || !data.booking || !data.guest.email || !data.booking.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        firstName: data.guest.firstName,
        lastName: data.guest.lastName,
        email: data.guest.email,
        phone: data.guest.phone || null,
        marketingOptIn: data.guest.marketingOptIn,
        businessId: data.guest.businessId
      }
    })

    // TODO: Integrate with Stripe payment processing
    // For now, we'll simulate a successful payment

    // Create the booking with items
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        sessionId: data.booking.sessionId,
        quantity: data.booking.quantity,
        total: data.booking.total,
        status: 'CONFIRMED',
        items: {
          create: data.booking.items
        }
      },
      include: {
        items: {
          include: {
            addOn: true
          }
        },
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

    // Update session capacity
    await prisma.session.update({
      where: { id: data.booking.sessionId },
      data: {
        currentCount: {
          increment: data.booking.quantity
        }
      }
    })

    // Send confirmation email
    try {
      // Initialize email service if not already done
      if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
        emailService.initialize({
          apiKey: process.env.SENDGRID_API_KEY,
          fromEmail: process.env.SENDGRID_FROM_EMAIL,
          fromName: process.env.SENDGRID_FROM_NAME || booking.session.event.experience.business.name
        })

        // Generate QR code as attachment for email
        let qrCodeBuffer: Buffer | undefined
        try {
          const qrData = {
            bookingId: booking.id,
            business: booking.session.event.experience.business.slug,
            type: 'booking'
          }
          // Use production URL or fallback to NEXTAUTH_URL
          const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const checkInUrl = `${baseUrl}/dashboard/check-in?data=${encodeURIComponent(JSON.stringify(qrData))}`

          console.log('🔗 QR Code URL generation:', {
            baseUrl,
            checkInUrl: checkInUrl.substring(0, 100) + '...',
            qrDataLength: JSON.stringify(qrData).length
          })

          const QRCode = await import('qrcode')

          // Generate QR code as PNG buffer for attachment
          qrCodeBuffer = await QRCode.toBuffer(checkInUrl, {
            type: 'png',
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })

          console.log('📱 QR Code buffer generation successful:', {
            generated: !!qrCodeBuffer,
            bufferLength: qrCodeBuffer?.length
          })

        } catch (qrError) {
          console.error('❌ Failed to generate QR code buffer for email:', qrError)
        }

        // Prepare email data
        const emailData: BookingEmailData = {
          guest: {
            firstName: booking.guest.firstName,
            lastName: booking.guest.lastName,
            email: booking.guest.email
          },
          booking: {
            id: booking.id,
            quantity: booking.quantity,
            total: Number(booking.total),
            createdAt: booking.createdAt.toISOString()
          },
          session: {
            startTime: booking.session.startTime.toISOString(),
            endTime: booking.session.endTime.toISOString()
          },
          event: {
            name: booking.session.event.name,
            description: booking.session.event.description
          },
          experience: {
            name: booking.session.event.experience.name
          },
          business: {
            name: booking.session.event.experience.business.name,
            slug: booking.session.event.experience.business.slug
          },
          qrCodeUrl: qrCodeBuffer ? 'attachment' : undefined
        }

        // Generate email template
        console.log('📧 Generating email template with QR code:', {
          hasQrCodeInData: !!emailData.qrCodeUrl,
          recipientEmail: booking.guest.email,
          bookingId: booking.id
        })

        const emailTemplate = emailService.generateBookingConfirmationEmail(emailData)

        console.log('📝 Email template generated:', {
          subjectLength: emailTemplate.subject.length,
          htmlLength: emailTemplate.html.length,
          textLength: emailTemplate.text.length,
          htmlContainsQrSection: emailTemplate.html.includes('qr-section'),
          htmlContainsDataUrl: emailTemplate.html.includes('data:image/png;base64,')
        })

        // Prepare QR code attachment with correct SendGrid format
        const attachments = qrCodeBuffer ? [{
          content: qrCodeBuffer.toString('base64'),
          filename: 'qr-code.png',
          type: 'image/png',
          disposition: 'inline',
          content_id: 'qrcode'
        }] : undefined

        console.log('📎 QR Code attachment prepared:', {
          hasBuffer: !!qrCodeBuffer,
          hasAttachments: !!attachments,
          base64Length: attachments?.[0]?.content?.length
        })

        // Send email with QR code attachment
        console.log('📤 Sending email via SendGrid...')
        await emailService.sendEmail({
          to: booking.guest.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          attachments
        })

        console.log('✅ Email sent successfully via SendGrid!')
      }
    } catch (emailError) {
      // Log email error but don't fail the booking
      console.error('Failed to send confirmation email:', emailError)
    }

    // TODO: Create calendar events
    // TODO: Send SMS notifications

    return NextResponse.json({
      bookingId: booking.id,
      status: 'success',
      message: 'Payment processed successfully'
    })

  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}