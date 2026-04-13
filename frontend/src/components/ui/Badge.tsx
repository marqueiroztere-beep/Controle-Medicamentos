import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, className = '', size = 'md' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-mono font-medium border rounded-md',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
