'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ensureSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';

export function DashboardGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);
  const status = useAuthStore((state) => state.status);
  const fetchSession = useAuthStore((state) => state.fetchSession);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (status === 'authenticated') {
      ensureSocket();
    }
  }, [status]);

  useEffect(() => {
    if (isReady && !user) {
      const search = searchParams?.toString();
      const here = `${pathname}${search ? `?${search}` : ''}`;
      // Preserve the in-flight URL (typically an invite link) so the user
      // lands back on it after signing in.
      const next = encodeURIComponent(here || '/');
      router.replace(`/login?next=${next}`);
    }
  }, [isReady, pathname, router, searchParams, user]);

  if (!isReady || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Restoring your session…
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
