interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

import React from 'react';

export function EmptyState({ icon = '📋', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl mb-4 opacity-60">{icon}</div>
      <h3 className="font-syne font-semibold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-text-muted text-sm max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  );
}
