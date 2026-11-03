type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function FeedSkeleton() {
  return (
    <div className="feed-skeleton" aria-busy="true" aria-label="Loading feed">
      {[0, 1, 2].map((item) => (
        <div key={item} className="feed-skeleton-card">
          <div className="feed-skeleton-meta">
            <Skeleton className="skeleton-badge" />
            <Skeleton className="skeleton-time" />
          </div>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-block" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="table-skeleton" aria-busy="true" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="table-skeleton-row">
          <Skeleton className="skeleton-cell skeleton-cell-lg" />
          <Skeleton className="skeleton-cell" />
          <Skeleton className="skeleton-cell skeleton-cell-sm" />
          <Skeleton className="skeleton-cell skeleton-cell-md" />
        </div>
      ))}
    </div>
  );
}
