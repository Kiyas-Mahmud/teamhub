'use client';

import Link from 'next/link';
import clsx from 'clsx';
import {
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  User,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const primaryLinks = [
  { href: '/', label: 'Workspaces', icon: LayoutDashboard },
  { href: '/new', label: 'New workspace', icon: Plus },
  { href: '/profile', label: 'Profile', icon: User },
];

export function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const workspaces = useWorkspaceStore((state) => state.items);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const fetchNotifications = useNotificationsStore((state) => state.fetchAll);
  const resetNotifications = useNotificationsStore((state) => state.reset);

  useEffect(() => {
    fetchWorkspaces().catch(() => toast.error('Could not load workspaces'));
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    } else {
      resetNotifications();
    }
  }, [user?.id, fetchNotifications, resetNotifications]);

  useEffect(() => setMobileOpen(false), [pathname]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 border-r border-border glass-bar lg:block">
        <SidebarContent
          pathname={pathname}
          user={user}
          workspaces={workspaces}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-64 glass-strong shadow-popover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold tracking-tight">Team Hub</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surfaceHover hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              user={user}
              workspaces={workspaces}
              onLogout={handleLogout}
              compact
            />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border glass-bar px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surfaceHover hover:text-fg lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="hidden text-sm font-medium text-muted sm:block">
              {currentSectionLabel(pathname)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted transition-colors hover:bg-surfaceHover hover:text-fg"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function currentSectionLabel(pathname) {
  if (!pathname || pathname === '/') return 'Workspaces';
  if (pathname === '/new') return 'New workspace';
  if (pathname === '/profile') return 'Profile';
  if (pathname.includes('/goals/')) return 'Goal';
  if (pathname.endsWith('/goals')) return 'Goals';
  if (pathname.endsWith('/action-items')) return 'Action items';
  if (pathname.endsWith('/announcements')) return 'Announcements';
  if (pathname.endsWith('/members')) return 'Members';
  if (pathname.endsWith('/analytics')) return 'Analytics';
  return 'Workspace';
}

function SidebarContent({ pathname, user, workspaces, onLogout, compact = false }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={clsx('flex items-center gap-2 border-b border-border px-4', compact ? 'h-12' : 'h-12')}>
        <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-[color:var(--accent-contrast)]">
          <span className="text-[11px] font-bold">T</span>
        </span>
        <span className="text-sm font-semibold tracking-tight">Team Hub</span>
      </div>

      <nav className="px-3 pt-4">
        <p className="px-2 pb-2 text-2xs font-medium uppercase tracking-wider text-subtle">
          Account
        </p>
        <ul className="space-y-0.5">
          {primaryLinks.map(({ href, label, icon: Icon }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href}
            />
          ))}
        </ul>
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-2 pb-2">
          <p className="text-2xs font-medium uppercase tracking-wider text-subtle">
            Workspaces
          </p>
          <span className="text-2xs font-medium text-subtle">{workspaces.length}</span>
        </div>
        <div className="scrollbar-fine min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {workspaces.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted">No workspaces yet.</p>
          ) : (
            workspaces.map((workspace) => {
              const active = pathname?.startsWith(`/${workspace.id}`);
              return (
                <Link
                  key={workspace.id}
                  href={`/${workspace.id}`}
                  className={clsx(
                    'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-surfaceHover text-fg'
                      : 'text-fgMuted hover:bg-surfaceHover hover:text-fg'
                  )}
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-semibold text-white"
                    style={{
                      background: workspace.accentColor || 'var(--accent)',
                    }}
                  >
                    {workspace.name?.slice(0, 1).toUpperCase() || 'W'}
                  </span>
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {workspace.role === 'ADMIN' && (
                    <span className="text-2xs text-subtle">Admin</span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          className="group flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-surfaceHover"
          aria-label="Account menu"
        >
          <Avatar size="md" name={user?.displayName} src={user?.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{user?.displayName || 'You'}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            className="grid h-7 w-7 place-items-center rounded text-subtle transition-colors hover:bg-surface hover:text-fg"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        </button>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }) {
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
          active
            ? 'bg-surfaceHover text-fg'
            : 'text-fgMuted hover:bg-surfaceHover hover:text-fg'
        )}
      >
        <Icon className={clsx('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-muted')} />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
