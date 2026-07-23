// Reconstructed layout.tsx for Min Nail & Hair application
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";

import SkipLink from "@/components/SkipLink";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeBanner from "@/components/ThemeBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import WebVitals from "@/components/WebVitals";

import PwaSupport from "@/components/PwaSupport";
import { DEFAULT_LOCALE, LANGUAGES, COOKIE_NAME } from "@/lib/i18n/config";

import { getBaseUrl } from "@/lib/env";
import { getSeoSettings } from "@/lib/seo";
import { createClient } from "@/utils/supabase/server";
import { testimonials } from "@/lib/testimonials";

import AnimeMascot from "@/components/AnimeMascot";

import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
 
import WebSiteSchema from "@/components/WebSiteSchema";

export const viewport: Viewport = {
  themeColor: "#fbbf24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
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
    const seo = await getSeoSettings();
    if (seo?.page_title) {
      const result: Metadata = {
        ...defaultMeta,
        title: seo.page_title || defaultMeta.title,
        description: seo.meta_description || defaultMeta.description,
        keywords: seo.meta_keywords || "",
        openGraph: {
          type: "website",
          locale: "vi_VN",
          siteName: "Min Nail & Hair",
          title: seo.page_title || "Min Nail & Hair - Salon Booking",
          description: seo.meta_description || "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
          url: baseUrl,
          images: [{ url: seo.og_image_url || `${baseUrl}/og-default.svg`, width: 1200, height: 630, alt: seo.page_title || "Min Nail & Hair" }],
        },
        twitter: {
          card: "summary_large_image",
          title: seo.page_title || "Min Nail & Hair - Salon Booking",
          description: seo.meta_description || "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
          images: [{ url: seo.og_image_url || `${baseUrl}/og-default.svg`, alt: seo.page_title || "Min Nail & Hair" }],
        },
      };
      return result;
    }
  } catch (e) {
    console.error("Error loading SEO metadata:", e);
  }

  return defaultMeta;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = getBaseUrl();
  const cookieStore = await cookies();
  const locale = cookieStore.get(COOKIE_NAME)?.value;
  const lang = locale && LANGUAGES[locale] ? locale : DEFAULT_LOCALE;

  let aggregateRating = null;
  let reviewList: { author: string; text: string; rating: number }[] = [];
  try {
    const supabase = await createClient();
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating, comment");
    if (reviews && reviews.length > 0) {
      reviewList = reviews.map((r) => ({
        author: "Khách hàng",
        text: r.comment || "",
        rating: r.rating,
      }));
    }
  } catch {}
  if (reviewList.length === 0) {
    reviewList = testimonials.map((t) => ({
      author: t.name,
      text: t.text,
      rating: t.rating,
    }));
  }
  if (reviewList.length > 0) {
    const total = reviewList.reduce((s: number, r) => s + r.rating, 0);
    aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": (total / reviewList.length).toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": reviewList.length,
    };
  }
  return (
    <html
      lang={lang}
      className="antialiased font-sans text-gray-900 bg-gray-50"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>

        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://dpviknfsfgvkfyurhtpm.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preload" href="/fonts/NotoSans-Vietnamese.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/NotoSans-Latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Vietnamese.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg" />
        <link rel="alternate icon" href="/icons/icon-192.png" type="image/png" />
        <meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Min Salon" />
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
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
              "@id": `${baseUrl}/#local-business`,
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
              "sameAs": ["https://facebook.com/minnailhair"],
              ...(aggregateRating ? { "aggregateRating": aggregateRating } : {}),
              ...(reviewList.length > 0
                ? {
                    "review": reviewList.map((r, i) => ({
                      "@type": "Review",
                      "@id": `${baseUrl}/#review-${i + 1}`,
                      "author": { "@type": "Person", "name": r.author },
                      "reviewBody": r.text,
                      "reviewRating": {
                        "@type": "Rating",
                        "ratingValue": r.rating,
                        "bestRating": 5,
                        "worstRating": 1,
                      },
                    })),
                  }
                : {}),
            })
          }}
        />
        <WebSiteSchema baseUrl={baseUrl} />
        <Analytics />
        <SpeedInsights />
        
      </head>

      <body className="antialiased font-sans text-gray-900 bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} suppressHydrationWarning>
        <WebVitals />
        <ErrorBoundary>
          <Toaster position="top-right" richColors closeButton />
          <SkipLink />
          <div className="overflow-x-clip">
            <ThemeProvider>
              <ThemeBanner />
              <main id="main-content" tabIndex={-1}>{children}</main>
              <PwaSupport />
              <AnimeMascot />
            </ThemeProvider>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
