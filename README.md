# TicketUp

**Event Booking Made Simple**

TicketUp is a modern event booking and management platform that streamlines the entire process from ticket sales to guest check-in. Built with Next.js, TypeScript, and Prisma.

## Features

- **Multi-Business Support**: Each business gets their own branded booking experience
- **Flexible Event Management**: Create experiences, events, and sessions with custom pricing
- **Add-ons & Upsells**: Boost revenue with optional add-ons
- **Secure Payments**: Integrated Stripe checkout
- **Guest Management**: Complete customer database and booking history
- **QR Code Check-ins**: Generate QR codes for easy guest check-in
- **Email Notifications**: Automated booking confirmations via SendGrid
- **Analytics Tracking**: Support for Google Analytics, Meta Pixel, TikTok, and more
- **Mobile Dashboard**: iOS app for business owners to manage check-ins

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Email**: SendGrid
- **Analytics**: Multiple platform support
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="your-secret-key"
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="booking@yourdomain.com"
```

## Database

Run migrations and seed data:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Deployment

This application is optimized for deployment on Vercel with automatic CI/CD from GitHub.
