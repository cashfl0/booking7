import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname.startsWith('/embed') ||
          pathname.startsWith('/widget') ||
          pathname.includes('/_next') ||
          pathname.includes('/favicon') ||
          // Allow business booking pages to be public
          /^\/[^\/]+$/.test(pathname) || // /businessSlug
          /^\/[^\/]+\/book/.test(pathname) // /businessSlug/book/*
        ) {
          return true
        }

        // API routes protection
        if (pathname.startsWith('/api/')) {
          return !!token
        }

        // Dashboard routes - require business owner or admin
        if (pathname.startsWith('/dashboard')) {
          return token?.role === 'BUSINESS_OWNER' || token?.role === 'ADMIN'
        }

        // Admin routes - require admin role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN'
        }

        // Default: allow public access for booking flows
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
}