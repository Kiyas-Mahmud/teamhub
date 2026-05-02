'use client';

import Link from 'next/link';
import clsx from 'clsx';

export function TabsNav({ items, className }) {
  return (
    <div className={clsx('relative border-b border-border', className)}>
      <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-fine">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'group relative inline-flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
              item.active ? 'text-fg' : 'text-muted hover:text-fg'
            )}
          >
            {item.icon && <item.icon className="h-3.5 w-3.5" />}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={clsx(
                  'rounded-md px-1.5 py-0.5 text-2xs font-semibold',
                  item.active
                    ? 'bg-accentSoft text-accent'
                    : 'bg-surfaceSoft text-muted'
                )}
              >
                {item.count}
              </span>
            )}
            <span
              className={clsx(
                'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-colors',
                item.active ? 'bg-accent' : 'bg-transparent'
              )}
            />
          </Link>
        ))}
      </nav>
    </div>
  );
}
