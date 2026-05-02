import { forwardRef } from 'react';
import clsx from 'clsx';

const baseInputClass =
  'w-full input-base px-3 py-2 text-sm text-fg placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx(baseInputClass, 'h-9', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(baseInputClass, 'min-h-[6rem] py-2.5', className)}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={clsx(baseInputClass, 'h-9 cursor-pointer appearance-none pr-8', className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function FormField({ label, error, hint, children, className }) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-medium text-fgMuted">{label}</label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-[color:var(--danger)]">{error}</p>}
    </div>
  );
}
