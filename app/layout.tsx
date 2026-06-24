import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import PwaSupport from "@/components/PwaSupport";
import SkipLink from "@/components/SkipLink";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeBanner from "@/components/ThemeBanner";
import MascotProvider from "@/components/MascotProvider";
import GoogleTranslate from "@/components/GoogleTranslate";
import ErrorBoundary from "@/components/ErrorBoundary";

import { Toaster } from 'sonner';
import Script from 'next/script';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

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
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app';
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
      images: [{ url: `${baseUrl}/icons/icon-512.svg` }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Min Nail & Hair - Salon Booking",
      description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
      images: [`${baseUrl}/icons/icon-512.svg`],
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
          images: [{ url: data.og_image_url || `${baseUrl}/icons/icon-512.svg` }],
        },
        twitter: {
          card: "summary_large_image",
          title: data.page_title || (defaultMeta.twitter as any).title,
          description: data.meta_description || (defaultMeta.twitter as any).description,
          images: [data.og_image_url || `${baseUrl}/icons/icon-512.svg`],
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app';
  return (
    <html lang="vi" className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.__debugLogs = [];
            function logDebug(msg, type='INFO') {
              const entry = { msg, type, time: new Date().toISOString().split('T')[1].split('Z')[0] };
              window.__debugLogs.push(entry);
              console.log('[' + type + '] ' + msg);
            }
            logDebug('System Init Started');

            var origOnError = window.onerror;
            window.onerror = function(msg, src, line, col, err) {
              var stack = err ? err.stack : 'No stack available';
              var fullMsg = msg + (src ? '\\nSrc: ' + src + ':' + line : '') + '\\nStack: ' + stack;
              logDebug(fullMsg, 'ERROR');
              if (origOnError) return origOnError.apply(window, arguments);
              return false;
            };
            window.addEventListener('unhandledrejection', function(e) {
              var reason = e.reason;
              var msg = reason instanceof Error ? reason.message : String(reason);
              var stack = reason instanceof Error ? reason.stack : 'No stack';
              logDebug('Promise Rejected: ' + msg + '\\nStack: ' + stack, 'ERROR');
            });

            // --- Storage Override with Tracing ---
            try { 
              logDebug('Testing localStorage...');
              window.localStorage.setItem('__test','1'); 
              window.localStorage.removeItem('__test'); 
              logDebug('localStorage is OK');
            } catch(e) {
              logDebug('localStorage blocked! Applying prototype patch...', 'WARN');
              if (typeof Storage !== 'undefined') {
                Storage.prototype.getItem = function(){return null};
                Storage.prototype.setItem = function(){};
                Storage.prototype.removeItem = function(){};
                Storage.prototype.clear = function(){};
                Storage.prototype.key = function(){return null};
                Object.defineProperty(Storage.prototype, 'length', {get: function(){return 0}, configurable: true});
                logDebug('Storage.prototype patched');
              }
            }

            try { 
              logDebug('Testing indexedDB...');
              window.indexedDB.open('__test'); 
              logDebug('indexedDB is OK');
            } catch(e) {
              logDebug('indexedDB blocked! Applying override...', 'WARN');
              var _safeReq = function(){this.result=null;this.error=null;this.onupgradeneeded=null;this.onsuccess=null;this.onerror=null;};
              var _safeIDB = { open: function(){return new _safeReq()}, deleteDatabase: function(){return new _safeReq()} };
              try { window.indexedDB = _safeIDB; logDebug('window.indexedDB overridden'); } catch(e2) { logDebug('Failed to override window.indexedDB', 'ERROR'); }
            }
          `,
        }} />
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
        <body className="antialiased font-sans text-gray-900 bg-gray-50" suppressHydrationWarning>
          <div id="early-error-display" style={{display:'none',position:'fixed',bottom:0,left:0,right:0,zIndex:99999,backgroundColor:'rgba(0,0,0,0.9)',color:'#fff',padding:'10px',fontSize:'11px',fontFamily:'monospace',maxHeight:'50vh',overflowY:'auto',borderTop:'3px solid red'}}></div>
          <script dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var div = document.getElementById('early-error-display');
                function updateDisplay() {
                  if (window.__debugLogs && window.__debugLogs.length > 0) {
                    div.style.display = 'block';
                    var html = '<strong>🛠 iOS DEBUG CONSOLE</strong><br>';
                    window.__debugLogs.forEach(function(l) {
                      var color = l.type === 'ERROR' ? '#ff4d4d' : (l.type === 'WARN' ? '#ffcc00' : '#aaa');
                      html += '<div style="margin-bottom:4px;border-bottom:1px solid #333;padding-bottom:2px">' +
                               '<span style="color:#888">[' + l.time + ']</span> ' +
                               '<span style="color:' + color + '">[' + l.type + ']</span> ' + l.msg + '</div>';
                    });
                    div.innerHTML = html;
                  }
                }
                setInterval(updateDisplay, 500);
                // Also override window.onerror again to ensure it's active
                var origOnError = window.onerror;
                window.onerror = function(msg, src, line, col, err) {
                  if (div) {
                    div.style.display = 'block';
                    var stack = err ? err.stack : 'No stack';
                    div.innerHTML = '<strong>⚠ CRASH DETECTED</strong><br>' + msg + '<br>' + stack + '<br>' + div.innerHTML;
                  }
                  if (origOnError) return origOnError.apply(window, arguments);
                  return false;
                };
              })();
            `,
          }} />
           <ErrorBoundary>
           <div className="fixed top-2 right-2 z-[9999]">
             <GoogleTranslate />
           </div>
           <SkipLink />
          <div className="overflow-x-hidden">
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
              "image": `${baseUrl}/icons/icon-512.svg`,
              "url": baseUrl,
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
           <Analytics />
           <SpeedInsights />
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

