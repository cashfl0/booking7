# Email Templates

This directory contains all email templates used throughout the application.

## Current Templates

### Booking Confirmation (`booking-confirmation.ts`)
- **Purpose**: Sent after successful booking completion
- **Trigger**: Automatic after payment processing
- **Includes**: Booking details, guest info, QR code for check-in
- **Variables**: Guest data, booking data, session data, business info

## Template Structure

Each template exports a function that takes data and returns:
```typescript
{
  subject: string
  html: string    // Rich HTML email
  text: string    // Plain text fallback
}
```

## Future Database Integration

Templates will eventually be stored in database to allow:

- **Business Owner Customization**: Each business can customize their email templates
- **Template Editor**: Web-based editor for non-technical users
- **Variable System**: Dynamic content insertion
- **Multiple Languages**: Support for different languages
- **A/B Testing**: Test different template variations
- **Template Versioning**: Track changes and rollback capability

## Adding New Templates

1. Create new template file in this directory
2. Export template function
3. Add to `index.ts` exports
4. Import in email service
5. Add method to EmailService class

## Template Guidelines

- Use inline CSS for email client compatibility
- Provide both HTML and text versions
- Include business branding elements
- Ensure mobile responsiveness
- Test across different email clients
- Use semantic HTML structure