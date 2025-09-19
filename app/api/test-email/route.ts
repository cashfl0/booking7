import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    // Initialize email service
    emailService.initialize({
      apiKey: process.env.SENDGRID_API_KEY!,
      fromEmail: process.env.SENDGRID_FROM_EMAIL!,
      fromName: process.env.SENDGRID_FROM_NAME || 'Test'
    })

    // Send test email
    await emailService.sendEmail({
      to: 'markflood960@gmail.com', // Your email from .env
      subject: 'SendGrid Test',
      html: '<h1>Test Email</h1><p>If you receive this, SendGrid is working!</p>',
      text: 'Test Email - If you receive this, SendGrid is working!'
    })

    return NextResponse.json({ success: true, message: 'Test email sent!' })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}