import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: 'teal' | 'purple' | 'amber' | 'danger' | 'success' | null;
}

const accentStyles = {
  teal:    'border-l-2 border-l-teal',
  purple:  'border-l-2 border-l-purple',
  amber:   'border-l-2 border-l-amber',
  danger:  'border-l-2 border-l-danger',
  success: 'border-l-2 border-l-success',
};

export function Card({ children, className = '', hover = false, onClick, accent = null }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-surface border border-border rounded-xl p-4',
        hover ? 'hover:border-muted transition-colors duration-150 cursor-pointer' : '',
        accent ? accentStyles[accent] : '',
        onClick ? 'cursor-pointer' : '',
        'animate-[slide-up_0.3s_ease-out]',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-syne font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}
