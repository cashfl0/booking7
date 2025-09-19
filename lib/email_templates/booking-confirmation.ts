import { BookingEmailData, EmailTemplate } from '../email'

export function generateBookingConfirmationTemplate(data: BookingEmailData): EmailTemplate {
  const { guest, booking, session, event, experience, business, qrCodeUrl } = data

  const startDate = new Date(session.startTime)
  const endDate = new Date(session.endTime)

  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`

  const subject = `Booking Confirmation - ${event.name} at ${business.name}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    .confirmation-badge { background: #28a745; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 10px; }
    .details-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-row { margin: 10px 0; }
    .label { font-weight: bold; }
    .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="confirmation-badge">✓ Confirmed</div>
    <h1>${business.name}</h1>
    <h2>Your booking is confirmed!</h2>
  </div>

  <p>Hello ${guest.firstName},</p>
  <p>Thank you for your booking! Here are your confirmation details:</p>

  <div class="details-section">
    <h3>Booking Details</h3>
    <div class="details-row">
      <span class="label">Experience:</span> ${experience.name}
    </div>
    <div class="details-row">
      <span class="label">Event:</span> ${event.name}
    </div>
    <div class="details-row">
      <span class="label">Date:</span> ${formattedDate}
    </div>
    <div class="details-row">
      <span class="label">Time:</span> ${formattedTime}
    </div>
    <div class="details-row">
      <span class="label">Tickets:</span> ${booking.quantity}
    </div>
    <div class="details-row">
      <span class="label">Total:</span> $${Number(booking.total).toFixed(2)}
    </div>
    <div class="details-row">
      <span class="label">Booking ID:</span> ${booking.id}
    </div>
  </div>

  <div class="details-section">
    <h3>Contact Information</h3>
    <div class="details-row">
      <span class="label">Name:</span> ${guest.firstName} ${guest.lastName}
    </div>
    <div class="details-row">
      <span class="label">Email:</span> ${guest.email}
    </div>
  </div>

  ${qrCodeUrl ? `
  <div class="qr-section">
    <h3>Check-in QR Code</h3>
    <p>Show this QR code to staff for quick check-in:</p>
    <img src="cid:qrcode" alt="Check-in QR Code" style="max-width: 200px; border: 1px solid #ddd; border-radius: 8px; display: block; margin: 10px auto;">
  </div>
  ` : ''}

  <div class="footer">
    <p>Questions? Contact ${business.name} for assistance.</p>
    <p>This is an automated confirmation email.</p>
  </div>
</body>
</html>`

  const text = `
Booking Confirmation - ${business.name}

Hello ${guest.firstName},

Your booking is confirmed! Here are your details:

BOOKING DETAILS
Experience: ${experience.name}
Event: ${event.name}
Date: ${formattedDate}
Time: ${formattedTime}
Tickets: ${booking.quantity}
Total: $${Number(booking.total).toFixed(2)}
Booking ID: ${booking.id}

CONTACT INFORMATION
Name: ${guest.firstName} ${guest.lastName}
Email: ${guest.email}

Questions? Contact ${business.name} for assistance.
This is an automated confirmation email.
`

  return { subject, html, text }
}