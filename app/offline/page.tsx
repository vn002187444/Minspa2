'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#EADDCD] p-8 max-w-md text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-3xl">📡</span>
        </div>
        <h1 className="text-lg font-bold text-[#3A2E2B]">Mất kết nối mạng</h1>
        <p className="text-sm text-gray-500">Vui lòng kiểm tra kết nối Internet và thử lại.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#5C4033] text-white text-sm font-bold rounded-xl hover:bg-[#4A3227] transition-colors">
          Thử lại
        </button>
      </div>
    </div>
  );
}
