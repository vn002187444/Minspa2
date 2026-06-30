export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
      <div className="animate-pulse space-y-6 max-w-2xl w-full px-4">
        <div className="h-8 bg-[#EADDCD] rounded w-1/3" />
        <div className="h-64 bg-[#EADDCD] rounded-2xl" />
        <div className="space-y-3">
          <div className="h-4 bg-[#EADDCD] rounded w-3/4" />
          <div className="h-4 bg-[#EADDCD] rounded w-full" />
          <div className="h-4 bg-[#EADDCD] rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
