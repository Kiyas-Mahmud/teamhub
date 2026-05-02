'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Drawer({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col glass-strong shadow-popover"
      >
        <header className="flex items-start justify-between gap-3 border-b border-divider px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surfaceHover hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="scrollbar-fine flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="border-t border-divider px-5 py-3">{footer}</footer>
        )}
      </aside>
    </div>
  );
}
