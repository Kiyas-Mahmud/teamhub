import { DashboardGuard } from '@/components/dashboard/DashboardGuard';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

// Dashboard pages require an authenticated session — no value in prerendering them
// statically. This also frees descendant components to use useSearchParams freely.
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }) {
  return (
    <DashboardGuard>
      <DashboardShell>{children}</DashboardShell>
    </DashboardGuard>
  );
}
