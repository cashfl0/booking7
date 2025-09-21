interface TrackingConfig {
  platform: string
  trackingId: string
  isEnabled: boolean
  environment?: string
}

interface EventData {
  event_name: string
  business_slug: string
  page_path?: string
  value?: number
  currency?: string
  items?: Array<{
    item_id?: string
    item_name?: string
    item_category?: string
    price?: number
    quantity?: number
  }>
}

class AnalyticsService {
  private loadedScripts = new Set<string>()
  private trackingConfigs: TrackingConfig[] = []

  async initializeTracking(businessSlug: string): Promise<void> {
    try {
      // Fetch tracking configs for this business
      const response = await fetch(`/api/analytics/${businessSlug}`)
      if (response.ok) {
        this.trackingConfigs = await response.json()
        await this.loadTrackingScripts()
      }
    } catch (error) {
      console.warn('Analytics tracking failed to initialize:', error)
      // Don't throw - we don't want to break the page if analytics fails
    }
  }

  private async loadTrackingScripts(): Promise<void> {
    for (const config of this.trackingConfigs) {
      if (!config.isEnabled) continue

      try {
        switch (config.platform) {
          case 'GOOGLE_ANALYTICS':
            await this.loadGoogleAnalytics(config.trackingId)
            break
          case 'META_PIXEL':
            await this.loadMetaPixel(config.trackingId)
            break
          case 'TIKTOK_PIXEL':
            await this.loadTikTokPixel(config.trackingId)
            break
          case 'GOOGLE_ADS':
            await this.loadGoogleAds(config.trackingId)
            break
          case 'SNAPCHAT_PIXEL':
            await this.loadSnapchatPixel(config.trackingId)
            break
        }
      } catch (error) {
        console.warn(`Failed to load ${config.platform} tracking:`, error)
        // Continue loading other scripts even if one fails
      }
    }
  }

  private async loadGoogleAnalytics(trackingId: string): Promise<void> {
    if (this.loadedScripts.has(`ga-${trackingId}`)) return

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`
    document.head.appendChild(script)

    await new Promise<void>((resolve) => {
      script.onload = () => {
        // Initialize gtag
        const gtag = (window as unknown as Record<string, unknown>).gtag as ((...args: unknown[]) => void)
        if (!gtag) {
          (window as unknown as Record<string, unknown>).dataLayer = (window as unknown as Record<string, unknown>).dataLayer || []
          ;(window as unknown as Record<string, unknown>).gtag = function(...args: unknown[]) {
            ;((window as unknown as Record<string, unknown>).dataLayer as unknown[]).push(args)
          }
        }

        const gtagFn = (window as unknown as Record<string, unknown>).gtag as (...args: unknown[]) => void
        gtagFn('js', new Date())
        gtagFn('config', trackingId)

        this.loadedScripts.add(`ga-${trackingId}`)
        resolve()
      }
      script.onerror = () => resolve() // Don't fail if script fails to load
    })
  }

  private async loadMetaPixel(pixelId: string): Promise<void> {
    if (this.loadedScripts.has(`meta-${pixelId}`)) return

    // Meta Pixel base code
    ;(function(f: Document, b: string, e: string) {
      if (f.getElementById(e)) return
      const v = f.createElement(b) as HTMLScriptElement
      v.async = true
      v.defer = true
      v.crossOrigin = 'anonymous'
      v.src = 'https://connect.facebook.net/en_US/fbevents.js'
      v.id = e
      const n = f.getElementsByTagName(b)[0] as HTMLScriptElement
      n.parentNode?.insertBefore(v, n)
    })(document, 'script', 'facebook-pixel')

    // Initialize pixel
    const fb = (window as unknown as Record<string, unknown>).fbq as ((...args: unknown[]) => void) || function(...args: unknown[]) {
      const fbqObj = (window as unknown as Record<string, unknown>).fbq as Record<string, unknown>
      if (fbqObj.callMethod) {
        // Use apply instead of call for better type safety
        (fbqObj.callMethod as (...args: unknown[]) => unknown)(...args)
      } else {
        (fbqObj.queue as unknown[]).push(args)
      }
    }

    ;(window as unknown as Record<string, unknown>).fbq = fb
    ;((window as unknown as Record<string, unknown>).fbq as Record<string, unknown>).push = fb
    ;((window as unknown as Record<string, unknown>).fbq as Record<string, unknown>).loaded = true
    ;((window as unknown as Record<string, unknown>).fbq as Record<string, unknown>).version = '2.0'
    ;((window as unknown as Record<string, unknown>).fbq as Record<string, unknown>).queue = []

    fb('init', pixelId)
    fb('track', 'PageView')

    this.loadedScripts.add(`meta-${pixelId}`)
  }

  private async loadTikTokPixel(pixelId: string): Promise<void> {
    if (this.loadedScripts.has(`tiktok-${pixelId}`)) return

    const script = document.createElement('script')
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++
        )ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `
    document.head.appendChild(script)

    this.loadedScripts.add(`tiktok-${pixelId}`)
  }

  private async loadGoogleAds(conversionId: string): Promise<void> {
    if (this.loadedScripts.has(`gads-${conversionId}`)) return

    // Google Ads uses the same gtag system as GA4
    await this.loadGoogleAnalytics(conversionId)
    this.loadedScripts.add(`gads-${conversionId}`)
  }

  private async loadSnapchatPixel(pixelId: string): Promise<void> {
    if (this.loadedScripts.has(`snap-${pixelId}`)) return

    const script = document.createElement('script')
    script.innerHTML = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
      snaptr('init', '${pixelId}', {});
      snaptr('track', 'PAGE_VIEW');
    `
    document.head.appendChild(script)

    this.loadedScripts.add(`snap-${pixelId}`)
  }

  trackEvent(eventData: EventData): void {
    try {
      // Google Analytics 4
      if ((window as unknown as Record<string, unknown>).gtag) {
        const gtag = (window as unknown as Record<string, unknown>).gtag as ((...args: unknown[]) => void)
        gtag('event', eventData.event_name, {
          business_slug: eventData.business_slug,
          page_path: eventData.page_path,
          value: eventData.value,
          currency: eventData.currency || 'USD',
          items: eventData.items
        })
      }

      // Meta Pixel
      if ((window as unknown as Record<string, unknown>).fbq) {
        const fbq = (window as unknown as Record<string, unknown>).fbq as (...args: unknown[]) => void
        const eventName = this.mapEventToMetaPixel(eventData.event_name)
        if (eventName) {
          fbq('track', eventName, {
            content_name: eventData.business_slug,
            value: eventData.value,
            currency: eventData.currency || 'USD'
          })
        }
      }

      // TikTok Pixel
      if ((window as unknown as Record<string, unknown>).ttq) {
        const ttq = (window as unknown as Record<string, unknown>).ttq as { track: (...args: unknown[]) => void }
        const eventName = this.mapEventToTikTok(eventData.event_name)
        if (eventName) {
          ttq.track(eventName, {
            content_name: eventData.business_slug,
            value: eventData.value,
            currency: eventData.currency || 'USD'
          })
        }
      }

      // Snapchat Pixel
      if ((window as unknown as Record<string, unknown>).snaptr) {
        const snaptr = (window as unknown as Record<string, unknown>).snaptr as (...args: unknown[]) => void
        const eventName = this.mapEventToSnapchat(eventData.event_name)
        if (eventName) {
          snaptr('track', eventName, {
            item_category: eventData.business_slug,
            price: eventData.value,
            currency: eventData.currency || 'USD'
          })
        }
      }
    } catch (error) {
      console.warn('Analytics event tracking failed:', error)
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  private mapEventToMetaPixel(eventName: string): string | null {
    const eventMap: Record<string, string> = {
      'page_view': 'PageView',
      'view_item': 'ViewContent',
      'begin_checkout': 'InitiateCheckout',
      'add_payment_info': 'AddPaymentInfo',
      'purchase': 'Purchase'
    }
    return eventMap[eventName] || null
  }

  private mapEventToTikTok(eventName: string): string | null {
    const eventMap: Record<string, string> = {
      'page_view': 'ViewContent',
      'view_item': 'ViewContent',
      'begin_checkout': 'InitiateCheckout',
      'add_payment_info': 'AddPaymentInfo',
      'purchase': 'CompletePayment'
    }
    return eventMap[eventName] || null
  }

  private mapEventToSnapchat(eventName: string): string | null {
    const eventMap: Record<string, string> = {
      'page_view': 'PAGE_VIEW',
      'view_item': 'VIEW_CONTENT',
      'begin_checkout': 'START_CHECKOUT',
      'add_payment_info': 'ADD_BILLING',
      'purchase': 'PURCHASE'
    }
    return eventMap[eventName] || null
  }
}

export const analyticsService = new AnalyticsService()
export type { EventData }