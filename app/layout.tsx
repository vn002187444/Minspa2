import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import PwaSupport from "@/components/PwaSupport";
import SkipLink from "@/components/SkipLink";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeBanner from "@/components/ThemeBanner";
import MascotProvider from "@/components/MascotProvider";
import GoogleTranslate from "@/components/GoogleTranslate";
import { Toaster } from 'sonner';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: "#fbbf24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = "https://min-nail-hair.vercel.app";
  const defaultMeta: Metadata = {
    title: "Min Nail & Hair - Salon Booking",
    description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
    manifest: "/manifest.json",
    alternates: { canonical: baseUrl },
    icons: {
      apple: { url: "/icons/icon-192.png", sizes: "192x192" },
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "Min Nail & Hair",
      title: "Min Nail & Hair - Salon Booking",
      description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
      url: baseUrl,
      images: [{ url: "https://min-nail-hair.vercel.app/icons/icon-512.svg" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Min Nail & Hair - Salon Booking",
      description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
      images: ["https://min-nail-hair.vercel.app/icons/icon-512.svg"],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Min Salon",
    }
  };

  try {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    const { data, error } = await supabase.from('seo_settings').select('page_title, meta_description, meta_keywords, og_image_url').eq('id', 1).single();
    if (!error && data) {
      return {
        title: data.page_title || defaultMeta.title,
        description: data.meta_description || defaultMeta.description,
        manifest: "/manifest.json",
        alternates: { canonical: baseUrl },
        icons: {
          apple: { url: "/icons/icon-192.png", sizes: "192x192" },
        },
        keywords: data.meta_keywords || "",
        appleWebApp: {
          capable: true,
          statusBarStyle: "default",
          title: "Min Salon",
        },
        openGraph: {
          type: "website" as const,
          locale: "vi_VN",
          siteName: "Min Nail & Hair",
          title: data.page_title || (defaultMeta.openGraph as any).title,
          description: data.meta_description || (defaultMeta.openGraph as any).description,
          url: baseUrl,
          images: [{ url: data.og_image_url || "https://min-nail-hair.vercel.app/icons/icon-512.svg" }],
        },
        twitter: {
          card: "summary_large_image",
          title: data.page_title || (defaultMeta.twitter as any).title,
          description: data.meta_description || (defaultMeta.twitter as any).description,
          images: [data.og_image_url || "https://min-nail-hair.vercel.app/icons/icon-512.svg"],
        },
      };
    }
  } catch (e) {
    console.error('Error loading SEO metadata:', e);
  }

  return defaultMeta;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://dpviknfsfgvkfyurhtpm.supabase.co" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://dpviknfsfgvkfyurhtpm.supabase.co" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preload" href="/icons/icon-192.png" as="image" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Min Salon" />
      </head>
       <body className="antialiased font-sans text-gray-900 bg-gray-50 overflow-x-hidden">
          <div className="fixed top-2 right-2 z-[9999]">
            <GoogleTranslate />
          </div>
          <SkipLink />
         <Script
           src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
           strategy="afterInteractive"
         />
         <Script id="google-analytics" strategy="afterInteractive">
           {`
             window.dataLayer = window.dataLayer || [];
             function gtag(){dataLayer.push(arguments);}
             gtag('js', new Date());
             gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
           `}
         </Script>
         <Toaster position="top-right" richColors closeButton />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Min Nail & Hair",
              "image": "https://min-nail-hair.vercel.app/icons/icon-512.svg",
              "url": "https://min-nail-hair.vercel.app",
              "telephone": "+84934323878",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "TM14 Chung cư Lavita Charm, Đường số 1",
                "addressLocality": "Trường Thọ, Thủ Đức",
                "addressRegion": "TP. Hồ Chí Minh",
                "addressCountry": "VN"
              },
              "openingHoursSpecification": [
                { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "09:00", "closes": "20:30" }
              ],
              "priceRange": "100000-1000000",
              "sameAs": ["https://facebook.com/minnailhair"]
            })
          }}
        />
          <ThemeProvider>
             <ThemeBanner />
             <MascotProvider>
              <main id="main-content">{children}</main>
              <PwaSupport />
            </MascotProvider>
          </ThemeProvider>
          <Analytics />
      </body>
    </html>
  );
}
