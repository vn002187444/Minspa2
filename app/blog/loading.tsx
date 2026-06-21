import { Skeleton, CardSkeleton } from '@/components/Skeleton';

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
