import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  experimental: {
    optimizePackageImports: ['@prisma/client', 'lucide-react']
  },

  turbopack: {
    root: __dirname
  },

  // Configure for Vercel deployment
  poweredByHeader: false,
  compress: true,

  // Image optimization for Vercel
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
