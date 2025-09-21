import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
  businessSlug: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { businessSlug } = await params

    // Find business by slug
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      include: {
        analyticsTracking: {
          where: {
            isEnabled: true,
            // Only load production environment for public pages
            OR: [
              { environment: 'production' },
              { environment: null }
            ]
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Return only the tracking configurations
    const trackingConfigs = business.analyticsTracking.map(tracking => ({
      platform: tracking.platform,
      trackingId: tracking.trackingId,
      isEnabled: tracking.isEnabled,
      environment: tracking.environment
    }))

    return NextResponse.json(trackingConfigs)
  } catch (error) {
    console.error('Error fetching analytics tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}