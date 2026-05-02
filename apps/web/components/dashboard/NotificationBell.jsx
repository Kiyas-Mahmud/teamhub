'use client';

import clsx from 'clsx';
import { Bell, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNotificationsStore } from '@/stores/notificationsStore';

function relativeTime(value) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const items = useNotificationsStore(useShallow((s) => s.items));
  const loaded = useNotificationsStore((s) => s.loaded);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function handlePick(notification) {
    setOpen(false);
    if (!notification.read) markRead(notification.id);
    if (notification.link) router.push(notification.link);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surfaceHover hover:text-fg focus-ring"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-[color:var(--accent-contrast)] ring-2 ring-bg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+6px)] z-40 w-80 max-w-[calc(100vw-1rem)] origin-top-right overflow-hidden rounded-lg glass-panel shadow-popover sm:w-96"
        >
          <header className="flex items-center justify-between border-b border-divider px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-fg">Notifications</p>
              <p className="text-2xs text-muted">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'All caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surfaceHover hover:text-fg disabled:opacity-40"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          </header>

          <div className="scrollbar-fine max-h-96 overflow-y-auto">
            {!loaded ? (
              <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <span className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted">
                  <Bell className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-fg">You&apos;re all caught up</p>
                <p className="mt-0.5 text-xs text-muted">
                  Mentions and updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-divider">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(n)}
                      className={clsx(
                        'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
                        n.read ? 'hover:bg-surfaceHover' : 'bg-accentSoft/40 hover:bg-accentSoft'
                      )}
                    >
                      <span
                        className={clsx(
                          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                          n.read ? 'bg-transparent' : 'bg-accent'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{n.title}</p>
                        {n.body && (
                          <p className="line-clamp-1 text-xs text-muted">{n.body}</p>
                        )}
                        <p className="mt-0.5 text-2xs text-subtle">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
