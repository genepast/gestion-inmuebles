function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonBox className="h-64" />
        <SkeletonBox className="h-64" />
      </div>
      <SkeletonBox className="h-56" />
      <SkeletonBox className="h-64" />
      <SkeletonBox className="h-52" />
    </div>
  );
}
