'use client';

export default function Error({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Da xay ra loi</h2>
        <p className="text-gray-500 mb-6">Vui long thu lai hoac quay ve trang chu.</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#8D6E53] text-white rounded-full font-medium hover:bg-[#5C4033] transition-colors cursor-pointer"
        >
          Thu lai
        </button>
      </div>
    </div>
  );
}
