'use client';
import CampaignActivationButton from '@/components/CampaignActivationButton';

export default function TabCampaign() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-[#3A2E2B] font-display">Chiến dịch</h2>
        <p className="text-sm text-[#6B7280]">Bật/tắt chế độ chiến dịch. Khi bật, hệ thống sẽ hiển thị banner & assets mùa (5-7) và gắn <code>data-campaign</code>.</p>
      </div>
      <CampaignActivationButton variant="admin" />
      <div className="rounded-xl bg-[#FAF6F0] border border-[#EADDCD] p-4 text-xs leading-relaxed text-[#6B7280]">
        <div className="font-bold text-[#3A2E2B] mb-1">Đã xong sẵn (1-4):</div>
        <ul className="list-disc pl-4 space-y-1">
          <li><code>docs/brand/tokens.json</code> + <code>BRAND_GUIDE.md</code></li>
          <li><code>public/brand/logo/</code> — monogram / wordmark / badge (SVG, nền trắng)</li>
          <li><code>public/icons/custom/</code> — nail-polish / herbal-bowl / massage-stone (outlined #8D6E53)</li>
          <li><code>public/cip/*.html</code> — 5 mockups in-ready (card/appointment/voucher/menu/letterhead) — mở file HTML để in/screenshot 300DPI</li>
        </ul>
        <div className="mt-3 font-bold text-[#3A2E2B]">Chờ kích hoạt (5-7):</div>
        <div>Banners hero/FB, IG templates, Slides — sẽ gen sau khi bạn bấm Kích hoạt.</div>
      </div>
    </div>
  );
}
