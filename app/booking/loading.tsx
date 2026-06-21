import { Skeleton } from '@/components/Skeleton';

export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4">
      <div className="max-w-xl lg:max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-[#EADDCD]">
        <div className="bg-[#5C4033] p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="h-3 w-64 bg-white/20" />
          </div>
          <div className="flex gap-2 mt-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-1 flex-1 bg-white/20" />
            ))}
          </div>
        </div>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
