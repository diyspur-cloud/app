'use client';

import React, { useRef, useState, useCallback } from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'interactive' | 'static' | 'accent';
  glowColor?: 'blue' | 'cyan' | 'purple';
  children: React.ReactNode;
}

export function GlassCard({
  variant = 'interactive',
  glowColor = 'blue',
  className = '',
  children,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || variant === 'static') return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  }, [variant]);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  const glowColorMap = {
    blue: 'rgba(59, 130, 246, 0.15)',
    cyan: 'rgba(6, 182, 212, 0.15)',
    purple: 'rgba(147, 51, 234, 0.15)',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`
        relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-glass)]
        bg-[var(--surface-1)] p-[var(--space-card-p)] backdrop-blur-[20px]
        transition-all duration-300 ease-[var(--ease-spring)]
        ${variant === 'interactive' ? 'hover:-translate-y-1 hover:border-[var(--border-specular)] hover:shadow-[var(--shadow-ambient)]' : ''}
        ${variant === 'accent' ? 'border-[var(--brand)] shadow-[var(--glow-primary)]' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Specular Radial Spotlight Track */}
      {variant !== 'static' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity: mousePos.opacity,
            background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColorMap[glowColor]}, transparent 80%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
