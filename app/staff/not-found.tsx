import Link from 'next/link';

export default function StaffNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-lg border border-[#EADDCD] space-y-4">
        <h2 className="text-xl font-bold text-[#5C4033]">Không tìm thấy trang</h2>
        <p className="text-sm text-stone-500">Trang nhân viên này không tồn tại.</p>
        <Link href="/staff" className="inline-block px-5 py-2.5 bg-[#8D6E53] text-white rounded-full text-xs font-bold hover:bg-[#5C4033] transition-all">
          Quay lại trang nhân viên
        </Link>
      </div>
    </div>
  );
}
