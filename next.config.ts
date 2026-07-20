import type { NextConfig } from "next";

const analyze = process.env.ANALYZE === "true";

const baseConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns', 'motion'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 768, 1024, 1280, 1600],
    imageSizes: [48, 80, 120, 192, 256],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === 'development' },
  },
  productionBrowserSourceMaps: false,
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://images.pexels.com https://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://api.open-meteo.com https://*.googleapis.com https://www.googletagmanager.com https://images.unsplash.com https://images.pexels.com https://va.vercel-scripts.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self'; frame-ancestors 'none'; form-action 'self';",
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://images.pexels.com https://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://api.open-meteo.com https://*.googleapis.com https://www.googletagmanager.com https://images.unsplash.com https://images.pexels.com https://va.vercel-scripts.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self'; frame-ancestors 'none'; form-action 'self';",
          },
        ],
      },
      {
        source: '/:path*.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff2|woff|ttf|otf|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },
};

let nextConfig: NextConfig = baseConfig;

if (analyze) {
  const withBundleAnalyzer = require("@next/bundle-analyzer");
  nextConfig = withBundleAnalyzer({
    enabled: true,
    openAnalyzer: true,
  })(baseConfig);
}

export default nextConfig;
