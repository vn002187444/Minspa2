export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#EADDCD] border-t-[#8D6E53] rounded-full animate-spin" />
        <p className="text-sm text-[#8D6E53] font-medium">Dang tai...</p>
      </div>
    </div>
  );
}
