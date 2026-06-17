'use client';

import { format } from 'date-fns';
import { Star } from 'lucide-react';

export default function TabReviews({ reviews }: { reviews: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mt-2 md:mt-0">
        <h2 className="text-xl font-bold text-gray-900 font-display">Đánh giá khách hàng</h2>
      </div>
      {reviews.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-2xl border border-gray-100 shadow-sm">Chưa có đánh giá nào từ khách hàng.</div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto whitespace-nowrap">
              <table className="w-full text-left min-w-[750px]">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4 pl-6">Mức điểm</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Thợ phục vụ</th>
                    <th className="p-4">Đánh giá nhanh</th>
                    <th className="p-4 pr-6 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5 text-pink-600 bg-pink-50/60 px-2.5 py-1 rounded-lg w-fit font-bold">
                          <span>{review.rating}</span>
                          <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-900">{review.appointments?.customers?.full_name || 'Khách vãng lai'}</td>
                      <td className="p-4 font-mono text-gray-500">{review.appointments?.customers?.phone || 'N/A'}</td>
                      <td className="p-4 font-medium text-gray-800">{review.appointments?.users?.full_name || 'Khác'}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1">
                            {review.quick_tags?.map((tag: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-600">{tag}</span>
                            ))}
                          </div>
                          {review.comment && <p className="text-xs text-gray-500 italic max-w-xs whitespace-normal line-clamp-2">&ldquo;{review.comment}&rdquo;</p>}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right font-mono text-gray-400 text-xs">
                        {review.created_at ? format(new Date(review.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="block md:hidden grid grid-cols-1 gap-4 animate-in fade-in duration-300">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-1.5 text-pink-600 bg-pink-50 px-3 py-1 rounded-xl w-fit font-black text-sm">
                    <span>{review.rating}</span>
                    <Star className="w-4 h-4 fill-current shrink-0" />
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">{review.created_at ? format(new Date(review.created_at), 'dd/MM/yy HH:mm') : ''}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900 font-bold">Khách: {review.appointments?.customers?.full_name || 'N/A'}<span className="font-mono text-xs text-gray-400 font-normal"> ({review.appointments?.customers?.phone || 'N/A'})</span></p>
                  <p className="text-gray-600">Phục vụ bởi: <strong className="text-gray-900">{review.appointments?.users?.full_name || 'Khác'}</strong></p>
                </div>
                {review.quick_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {review.quick_tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-100 rounded-lg text-gray-600">{tag}</span>
                    ))}
                  </div>
                )}
                {review.comment && (
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs text-gray-700 italic font-medium leading-relaxed">&ldquo;{review.comment}&rdquo;</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
