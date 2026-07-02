import React from 'react';


interface VipPackagesProps {
  packages: any[];
}

export default function VipPackages({ packages }: VipPackagesProps) {
  return (
    <section className="py-12 bg-white border-y border-[#EADDCD] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-10 text-center space-y-3">
        <span className="text-xs tracking-[0.2em] font-bold text-[#8D6E53] uppercase block">
          Gói Liệu Trình VIP
        </span>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B]">
          Ưu Đãi Siêu Hời
        </h2>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          Mua liệu trình nhiều buổi để nhận ưu đãi tặng thêm buổi hoàn toàn miễn phí.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-[#FAF6F0] rounded-3xl p-6 border border-[#EADDCD] flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-bold text-lg text-[#3A2E2B]">{pkg.name}</h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                Tặng {pkg.free_count} Buổi
              </span>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              Gói {pkg.buy_count} buổi + tặng {pkg.free_count} buổi. Tổng cộng {pkg.total_sessions} buổi.
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#EADDCD]/50">
              <span className="text-xl font-bold text-[#8D6E53]">{pkg.price.toLocaleString('vi-VN')} ₫</span>
              <a href={`/booking?buy_pkg=${pkg.id}`} className="text-xs font-bold text-[#5C4033] hover:underline">
                Đặt Mua →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
