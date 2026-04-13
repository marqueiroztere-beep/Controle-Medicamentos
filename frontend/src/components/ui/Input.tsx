import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, hint, icon, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={[
            'w-full bg-surface border rounded-lg px-3 py-2.5',
            'text-text-primary placeholder:text-text-muted text-sm',
            'transition-colors duration-150',
            'focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30',
            error ? 'border-danger' : 'border-border hover:border-muted',
            icon ? 'pl-9' : '',
            className,
          ].filter(Boolean).join(' ')}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, className = '', id, children, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={[
          'w-full bg-surface border rounded-lg px-3 py-2.5',
          'text-text-primary text-sm cursor-pointer',
          'transition-colors duration-150',
          'focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30',
          error ? 'border-danger' : 'border-border hover:border-muted',
          className,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, className = '', id, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={[
          'w-full bg-surface border rounded-lg px-3 py-2.5',
          'text-text-primary placeholder:text-text-muted text-sm',
          'transition-colors duration-150 resize-y min-h-[80px]',
          'focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30',
          error ? 'border-danger' : 'border-border hover:border-muted',
          className,
        ].filter(Boolean).join(' ')}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
