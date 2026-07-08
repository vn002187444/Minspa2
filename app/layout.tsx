// Reconstructed layout.tsx for Min Nail & Hair application
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

import dynamic from "next/dynamic";
import SkipLink from "@/components/SkipLink";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeBanner from "@/components/ThemeBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import WebVitals from "@/components/WebVitals";

import PwaSupport from "@/components/PwaSupport";

import { getBaseUrl } from "@/lib/env";

const MascotProvider = dynamic(() => import("@/components/MascotProvider"));

import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
 
import AggregateRatingSchema from "@/components/AggregateRatingSchema";
import WebSiteSchema from "@/components/WebSiteSchema";

// Simple in-memory cache for metadata (TTL 5 minutes)
let metadataCache: { data: Metadata | null; fetchedAt: number } = {
  data: null,
  fetchedAt: 0,
};

export const viewport: Viewport = {
  themeColor: "#fbbf24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  // In‑memory cache (TTL 5 minutes)
  const now = Date.now();
  const TTL = 5 * 60 * 1000; // 5 minutes in ms
  if (metadataCache.data && now - metadataCache.fetchedAt < TTL) {
    return metadataCache.data;
  }

  const baseUrl = getBaseUrl();
  const defaultMeta: Metadata = {
    metadataBase: new URL(baseUrl),
    title: "Min Nail & Hair - Salon Booking",
    description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
    manifest: "/manifest.json",
    alternates: { canonical: baseUrl },
    icons: { apple: { url: "/icons/icon-192.png", sizes: "192x192" } },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "Min Nail & Hair",
      title: "Min Nail & Hair - Salon Booking",
      description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
      url: baseUrl,
      images: [{ url: `${baseUrl}/og-default.svg`, width: 1200, height: 630, alt: "Min Nail & Hair - Salon làm đẹp tại Thủ Đức" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Min Nail & Hair - Salon Booking",
      description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
      images: [{ url: `${baseUrl}/og-default.svg`, alt: "Min Nail & Hair - Salon làm đẹp tại Thủ Đức" }],
    },
    appleWebApp: { capable: true, statusBarStyle: "default", title: "Min Salon" },
    robots: { index: true, follow: true },
  };

  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seo_settings")
      .select("page_title, meta_description, meta_keywords, og_image_url")
      .eq("id", 1)
      .single();

    if (!error && data) {
      const result: Metadata = {
        ...defaultMeta,
        title: data.page_title || defaultMeta.title,
        description: data.meta_description || defaultMeta.description,
        keywords: data.meta_keywords || "",
        openGraph: {
          ...defaultMeta.openGraph,
          title: data.page_title || defaultMeta.openGraph?.title || defaultMeta.title,
          description: data.meta_description || defaultMeta.openGraph?.description || defaultMeta.description,
          images: [{ url: data.og_image_url || `${baseUrl}/og-default.svg`, width: 1200, height: 630, alt: data.page_title || "Min Nail & Hair" }],
        },
        twitter: {
          ...defaultMeta.twitter,
          title: data.page_title || defaultMeta.twitter?.title || defaultMeta.title,
          description: data.meta_description || defaultMeta.twitter?.description || defaultMeta.description,
          images: [{ url: data.og_image_url || `${baseUrl}/og-default.svg`, alt: data.page_title || "Min Nail & Hair" }],
        },
      };
      metadataCache = { data: result, fetchedAt: now };
      return result;
    }
  } catch (e) {
    console.error("Error loading SEO metadata:", e);
  }

  // Fallback to default metadata and cache it
  metadataCache = { data: defaultMeta, fetchedAt: now };
  return defaultMeta;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = getBaseUrl();
  return (
    <html
      lang="vi"
      className="antialiased font-sans text-gray-900 bg-gray-50"
      suppressHydrationWarning
    >
      <head>

        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://dpviknfsfgvkfyurhtpm.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preload" href="/fonts/NotoSans-Vietnamese.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/NotoSans-Latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg" />
        <link rel="alternate icon" href="/icons/icon-192.png" type="image/png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Min Salon" />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "#local-business",
              "name": "Min Nail & Hair",
              "image": `${baseUrl}/icons/icon-512.png`,
              "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/icons/icon-512.png`,
              },
              "url": baseUrl,
              "telephone": "+84934323878",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "TM14 Chung cư Lavita Charm, Đường số 1",
                "addressLocality": "Trường Thọ, Thủ Đức",
                "addressRegion": "TP. Hồ Chí Minh",
                "addressCountry": "VN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 10.849,
                "longitude": 106.772
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                  ],
                  "opens": "09:00",
                  "closes": "20:30"
                }
              ],
              "priceRange": "100000-1000000",
              "sameAs": ["https://facebook.com/minnailhair"]
            })
          }}
        />
        <WebSiteSchema baseUrl={baseUrl} />
        <AggregateRatingSchema />
        <Analytics />
        <SpeedInsights />
        
      </head>

      <body className="antialiased font-sans text-gray-900 bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} suppressHydrationWarning>
        <WebVitals />
        <ErrorBoundary>
          <Toaster position="top-right" richColors closeButton />
          {/* GoogleTranslate moved to HeaderNav */}
          <SkipLink />
          <div className="overflow-x-clip">
            <ThemeProvider>
              <ThemeBanner />
              <MascotProvider>
                <main id="main-content">{children}</main>
                <PwaSupport />
              </MascotProvider>
            </ThemeProvider>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
