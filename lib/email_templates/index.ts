// Email Templates Directory
// This directory contains all email templates used throughout the application
// Future: These will be moved to database for business owner customization

export { generateBookingConfirmationTemplate } from './booking-confirmation'

// Template types for future database integration
export interface EmailTemplateConfig {
  id: string
  name: string
  type: 'booking_confirmation' | 'reminder' | 'waiver' | 'marketing'
  businessId?: string // null for system templates, businessId for custom templates
  subject: string
  htmlTemplate: string
  textTemplate: string
  variables: string[] // List of variables used in template
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Future implementation ideas:
// - Database storage for custom business templates
// - Template editor interface for business owners
// - Variable replacement engine
// - Template versioning and rollback
// - A/B testing for marketing templates
// - Multi-language support