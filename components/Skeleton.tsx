export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#EADDCD]/50 rounded-xl ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#EADDCD] p-5 space-y-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#EADDCD]">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3 border-t border-[#EADDCD]/50">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-1/4' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
