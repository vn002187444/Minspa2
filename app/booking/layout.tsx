import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đặt lịch Min Nail & Hair - Gội đầu, làm móng tại Thủ Đức',
  description: 'Đặt lịch hẹn trực tuyến tại Min Nail & Hair. Dịch vụ gội đầu dưỡng sinh, làm móng, massage tại Thủ Đức. Đặt lịch nhanh chóng, tiện lợi.',
  alternates: { canonical: '/booking' },
  openGraph: {
    title: 'Đặt lịch Min Nail & Hair - Gội đầu, làm móng tại Thủ Đức',
    description: 'Đặt lịch hẹn trực tuyến tại Min Nail & Hair. Dịch vụ gội đầu dưỡng sinh, làm móng, massage tại Thủ Đức.',
    url: '/booking',
    siteName: 'Min Nail & Hair',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app'}/icons/icon-512.png`, width: 512, height: 512, alt: 'Đặt lịch Min Nail & Hair' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đặt lịch Min Nail & Hair - Gội đầu, làm móng tại Thủ Đức',
    description: 'Đặt lịch hẹn trực tuyến tại Min Nail & Hair. Dịch vụ gội đầu dưỡng sinh, làm móng, massage tại Thủ Đức.',
    images: [{ url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app'}/icons/icon-512.png`, alt: 'Đặt lịch Min Nail & Hair' }],
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
