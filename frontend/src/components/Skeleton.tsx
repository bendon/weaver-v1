import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  count?: number;
  className?: string;
}

export function Skeleton({
  width,
  height = '1rem',
  circle = false,
  count = 1,
  className = ''
}: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{
        width: width || (circle ? height : '100%'),
        height,
      }}
    />
  ));

  return count > 1 ? <>{skeletons}</> : skeletons[0];
}

export function SkeletonCard({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      {children}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonBookingCard() {
  return (
    <SkeletonCard className="skeleton-booking-card">
      <div className="skeleton-booking-header">
        <Skeleton width="200px" height="1.5rem" />
        <Skeleton width="80px" height="1.5rem" />
      </div>
      <div className="skeleton-booking-dates">
        <Skeleton width="150px" height="1rem" />
      </div>
      <div className="skeleton-booking-info">
        <Skeleton width="100px" height="0.875rem" />
        <Skeleton width="120px" height="0.875rem" />
      </div>
    </SkeletonCard>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} height="1rem" width="80px" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
