'use client';

import React from 'react';

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function CyberButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: CyberButtonProps) {
  const sizeClasses = {
    sm: 'min-h-[40px] px-4 text-xs',
    md: 'min-h-[48px] px-6 text-sm',
    lg: 'min-h-[54px] px-8 text-base',
  };

  const variantStyles = {
    primary: `
      bg-[var(--brand)] text-[var(--brand-text)] font-semibold
      border border-[var(--border-specular)] shadow-[var(--shadow-brand)]
      hover:brightness-110 hover:shadow-[0_0_32px_rgba(0,91,255,0.45)]
    `,
    secondary: `
      bg-[var(--surface-2)] text-[var(--text-primary)] font-medium
      border border-[var(--border)]
      hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)]
    `,
    glass: `
      bg-[color-mix(in_srgb,var(--surface-1)_65%,transparent)] text-[var(--text-primary)]
      backdrop-blur-[16px] border border-[var(--border-glass)]
      hover:border-[var(--border-specular)] hover:bg-[var(--surface-2)]
    `,
    ghost: `
      bg-transparent text-[var(--text-secondary)]
      hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]
    `,
    danger: `
      bg-[color-mix(in_srgb,var(--negative)_14%,transparent)] text-[var(--negative-text)]
      border border-[var(--negative)] hover:bg-[color-mix(in_srgb,var(--negative)_22%,transparent)]
    `,
  };

  return (
    <button
      className={`
        group relative inline-flex items-center justify-center font-medium
        rounded-[var(--radius-pill)] transition-all duration-200 ease-[var(--ease-spring)]
        focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--brand)]
        disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none
        ${sizeClasses[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2" aria-live="polite">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Carregando...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">{children}</span>
      )}
    </button>
  );
}
