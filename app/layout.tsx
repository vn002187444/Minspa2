import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import * as fs from 'fs';
import * as path from 'path';
import PwaSupport from "@/components/PwaSupport";

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
  const defaultMeta: Metadata = {
    title: "Min Nail & Hair - Salon Booking",
    description: "Ứng dụng đặt lịch Gội dưỡng sinh & Nail chuyên nghiệp tại Thủ Đức",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Min Salon",
    }
  };

  try {
    const filePath = path.join(process.cwd(), 'data/seo.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return {
        title: data.page_title || defaultMeta.title,
        description: data.meta_description || defaultMeta.description,
        manifest: "/manifest.json",
        keywords: data.meta_keywords || "",
        appleWebApp: {
          capable: true,
          statusBarStyle: "default",
          title: "Min Salon",
        },
        openGraph: data.og_image_url ? {
          images: [{ url: data.og_image_url }]
        } : undefined
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
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans text-gray-900 bg-gray-50 overflow-x-hidden">
        {children}
        <PwaSupport />
      </body>
    </html>
  );
}

