import { Skeleton } from '@/components/Skeleton';

export default function StaffLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[#EADDCD] p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[#EADDCD] p-4 flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
