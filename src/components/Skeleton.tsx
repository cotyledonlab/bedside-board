interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

/**
 * Skeleton placeholder for loading content
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton for the full dashboard while loading
 */
export function DashboardSkeleton() {
  return (
    <div className="container skeleton-dashboard" aria-label="Loading dashboard">
      {/* Top Bar Skeleton */}
      <div className="top-bar">
        <div className="date-display">
          <div className="date-nav">
            <Skeleton width="32px" height="32px" borderRadius="8px" />
            <Skeleton width="120px" height="24px" />
            <Skeleton width="32px" height="32px" borderRadius="8px" />
          </div>
        </div>
        <div className="top-bar-actions">
          <Skeleton width="44px" height="38px" borderRadius="8px" />
          <Skeleton width="80px" height="38px" borderRadius="8px" />
        </div>
      </div>

      {/* Admission Section Skeleton */}
      <div className="section">
        <div className="admission-row">
          <Skeleton width="70px" height="16px" />
          <Skeleton width="140px" height="32px" />
        </div>
      </div>

      {/* Mood Section Skeleton */}
      <div className="section">
        <Skeleton width="150px" height="16px" className="skeleton-title" />
        <div className="mood-picker">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} width="100%" height="56px" borderRadius="12px" />
          ))}
        </div>
      </div>

      {/* Metrics Section Skeleton */}
      <div className="section">
        <Skeleton width="100px" height="16px" className="skeleton-title" />
        {[1, 2, 3].map(i => (
          <div key={i} className="slider-group">
            <div className="slider-header">
              <Skeleton width="100px" height="16px" />
              <Skeleton width="30px" height="20px" />
            </div>
            <Skeleton width="100%" height="8px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Notes Section Skeleton */}
      <div className="section">
        <Skeleton width="140px" height="16px" className="skeleton-title" />
        <Skeleton width="100%" height="80px" borderRadius="8px" />
      </div>

      {/* Events Section Skeleton */}
      <div className="section">
        <Skeleton width="100px" height="16px" className="skeleton-title" />
        <div className="event-buttons">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width="100px" height="40px" borderRadius="20px" />
          ))}
        </div>
      </div>
    </div>
  )
}
