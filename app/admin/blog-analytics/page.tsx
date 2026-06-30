import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ArrowLeft, Eye, TrendingUp, Calendar } from 'lucide-react';

export const revalidate = 60;

export default async function BlogAnalyticsPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('blogs')
    .select('id, title, slug')
    .order('created_at', { ascending: false });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: allStats } = await supabase
    .from('blog_stats')
    .select('post_id, date, views')
    .order('date', { ascending: false });

  const { data: recentStats } = await supabase
    .from('blog_stats')
    .select('post_id, views')
    .gte('date', sevenDaysAgoStr);

  const totalViews = allStats?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;
  const recentTotal = recentStats?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;

  const viewsPerPost = (posts || []).map((post) => {
    const total = allStats?.filter((s) => s.post_id === post.id).reduce((sum, s) => sum + (s.views || 0), 0) || 0;
    const recent7 = recentStats?.filter((s) => s.post_id === post.id).reduce((sum, s) => sum + (s.views || 0), 0) || 0;
    const trend = total > 0 ? Math.round((recent7 / total) * 100) : 0;
    return { ...post, totalViews: total, recent7, trend };
  }).sort((a, b) => b.totalViews - a.totalViews);

  const { data: dailyStats } = await supabase
    .from('blog_stats')
    .select('date, views')
    .order('date', { ascending: false })
    .limit(30);

  const dailyTotals: Record<string, number> = {};
  (dailyStats || []).forEach((s) => {
    dailyTotals[s.date] = (dailyTotals[s.date] || 0) + (s.views || 0);
  });
  const dailyTrend = Object.entries(dailyTotals).slice(0, 14).reverse();

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
      <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8">
        <div className="max-w-7xl xxl:max-w-[1500px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/blog" className="p-2 border border-[#EADDCD] rounded-full hover:bg-stone-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-[#8D6E53]" />
            </Link>
            <div>
              <span className="font-display font-black text-lg tracking-wider text-[#3A2E2B] uppercase">BLOG ANALYTICS</span>
              <p className="text-[11px] text-[#8D6E53] font-medium font-mono lowercase">Thống kê lượt xem bài viết</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl xxl:max-w-[1500px] mx-auto px-4 md:px-8 mt-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-[#EADDCD]/60 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#8D6E53]/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#8D6E53]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-stone-500">Tổng lượt xem</p>
                <p className="text-3xl font-black text-stone-900">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-[#EADDCD]/60 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-stone-500">7 ngày qua</p>
                <p className="text-3xl font-black text-stone-900">{recentTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-[#EADDCD]/60 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-stone-500">Bài viết</p>
                <p className="text-3xl font-black text-stone-900">{(posts || []).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Views Per Post Table */}
        <div className="bg-white rounded-3xl border border-[#EADDCD]/80 p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-[#5C4033] uppercase tracking-wider border-b border-[#EADDCD] pb-4 mb-6">
            Lượt xem theo bài viết
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider text-[11px]">
                  <th className="pb-3.5 pl-2 font-black">Bài viết</th>
                  <th className="pb-3.5 font-black text-right">Tổng lượt xem</th>
                  <th className="pb-3.5 font-black text-right">7 ngày qua</th>
                  <th className="pb-3.5 pr-2 font-black text-right">Xu hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                {viewsPerPost.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">Chưa có dữ liệu</td>
                  </tr>
                ) : (
                  viewsPerPost.map((post) => (
                    <tr key={post.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3.5 pl-2">
                        <Link href={`/blog/${post.slug}`} className="text-[#8D6E53] hover:text-[#5C4033] font-bold">
                          {post.title}
                        </Link>
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold">{post.totalViews}</td>
                      <td className="py-3.5 text-right font-mono">{post.recent7}</td>
                      <td className="py-3.5 pr-2 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase ${
                          post.trend > 50
                            ? 'bg-emerald-50 text-emerald-700'
                            : post.trend > 20
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-stone-50 text-stone-500'
                        }`}>
                          {post.trend > 50 ? '🔥' : post.trend > 20 ? '📈' : '📊'} {post.trend}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Trend */}
        {dailyTrend.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#EADDCD]/80 p-6 md:p-8 shadow-sm">
            <h2 className="text-base font-bold text-[#5C4033] uppercase tracking-wider border-b border-[#EADDCD] pb-4 mb-6">
              Xu hướng hàng ngày (14 ngày)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider text-[11px]">
                    <th className="pb-3.5 font-black">Ngày</th>
                    <th className="pb-3.5 font-black text-right">Lượt xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                  {dailyTrend.map(([date, views]) => (
                    <tr key={date} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-2.5 font-mono text-stone-600">{date}</td>
                      <td className="py-2.5 text-right font-mono font-bold">{views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
