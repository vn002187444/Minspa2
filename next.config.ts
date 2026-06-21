import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 768, 1024, 1280, 1600],
    imageSizes: [48, 80, 120, 192, 256],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === 'development' },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://*.google-analytics.com; connect-src 'self' https://*.supabase.co https://*.google-analytics.com; font-src 'self' data:; frame-ancestors 'none'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
