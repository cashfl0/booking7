# Vercel Deployment Guide

This booking application is now ready for deployment on Vercel! Follow these steps to deploy successfully.

## Prerequisites

1. ✅ **Production Build Test**: The application builds successfully with `npm run build`
2. ✅ **Linting**: All linting errors have been resolved
3. ✅ **Environment Variables**: `.env.example` file created with all required variables
4. ✅ **Vercel Configuration**: `vercel.json` and optimized `next.config.ts` ready

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will automatically detect this as a Next.js project

### 3. Configure Environment Variables
In your Vercel dashboard, add these environment variables:

#### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string (use Vercel Postgres, Supabase, or PlanetScale)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your domain (e.g., `https://your-app.vercel.app`)

#### Optional (for full functionality):
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `RESEND_API_KEY` - For email notifications
- `TWILIO_ACCOUNT_SID` - For SMS notifications
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

### 4. Database Setup
Choose one of these PostgreSQL providers:

#### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to Storage tab
2. Create a new Postgres database
3. Copy the connection string to `DATABASE_URL`

#### Option B: Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Set as `DATABASE_URL`

#### Option C: PlanetScale
1. Create database at [planetscale.com](https://planetscale.com)
2. Get connection string
3. Set as `DATABASE_URL`

### 5. Deploy
1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Your app will be available at your Vercel URL

## Post-Deployment

### Database Migration
After first deployment, run database migration:
```bash
npx prisma migrate deploy
```

### Seed Data (Optional)
To create a test business owner:
```bash
npx prisma db seed
```

This creates:
- Email: `owner@funbox.com`
- Password: `password123`
- Business: `Funbox Indoor`

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics/monitoring setup (optional)

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Ensure `DATABASE_URL` is a valid PostgreSQL connection string
- Verify all dependencies are in `package.json`

### Runtime Errors
- Check Vercel function logs in dashboard
- Ensure database is accessible from Vercel
- Verify NextAuth configuration

## Performance Optimizations

✅ **Already Configured:**
- Image optimization
- Package imports optimization
- Compression enabled
- Security headers
- Turbopack build optimization

Your booking application is production-ready! 🚀