import React from 'react';

export interface CyberSkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: string;
}

export function CyberSkeleton({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = 'rounded-[var(--radius-sm)]',
}: CyberSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`
        relative overflow-hidden bg-[var(--surface-2)] border border-[var(--border-glass)]
        ${height} ${width} ${rounded} ${className}
      `}
    >
      <div
        className="
          absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]
          bg-gradient-to-r from-transparent via-white/[0.09] to-transparent
        "
        style={{
          animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}
