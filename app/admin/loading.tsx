import { Skeleton } from '@/components/Skeleton';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[#EADDCD] p-5 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#EADDCD] p-5 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
