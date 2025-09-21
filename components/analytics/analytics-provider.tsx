'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { analyticsService, type EventData } from '@/lib/analytics'

interface AnalyticsProviderProps {
  businessSlug: string
  children: React.ReactNode
}

export function AnalyticsProvider({ businessSlug, children }: AnalyticsProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const initializeAnalytics = async () => {
      try {
        await analyticsService.initializeTracking(businessSlug)

        if (mounted) {
          // Track initial page view
          analyticsService.trackEvent({
            event_name: 'page_view',
            business_slug: businessSlug,
            page_path: pathname
          })
        }
      } catch (error) {
        // Analytics errors should not break the app
        console.warn('Analytics initialization failed:', error)
      }
    }

    initializeAnalytics()

    return () => {
      mounted = false
    }
  }, [businessSlug, pathname])

  return <>{children}</>
}


export function useAnalytics(businessSlug: string) {
  const trackEvent = (eventData: Omit<EventData, 'business_slug'>) => {
    try {
      analyticsService.trackEvent({
        ...eventData,
        business_slug: businessSlug
      })
    } catch (error) {
      console.warn('Analytics event tracking failed:', error)
    }
  }

  return { trackEvent }
}