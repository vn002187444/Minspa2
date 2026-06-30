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
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
