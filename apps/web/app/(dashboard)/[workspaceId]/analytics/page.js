'use client';

import dynamic from 'next/dynamic';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { api } from '@/lib/api';

const AnalyticsChart = dynamic(() => import('@/components/dashboard/AnalyticsChart'), {
  ssr: false,
});

export default function AnalyticsPage({ params }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/workspaces/${params.workspaceId}/analytics`)
      .then(setAnalytics)
      .catch((error) => toast.error(error.message || 'Could not load analytics'))
      .finally(() => setLoading(false));
  }, [params.workspaceId]);

  async function downloadCsv() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspaces/${params.workspaceId}/analytics/export`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Could not export analytics');
      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-${params.workspaceId}-analytics.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || 'Could not export analytics');
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg glass-panel p-10 text-center text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Loading analytics…
        </span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-lg glass-panel p-10 text-center text-sm text-muted">
        Analytics unavailable.
      </div>
    );
  }

  const tiles = [
    { label: 'Goals', value: analytics.totals.totalGoals },
    { label: 'Completed goals', value: analytics.totals.completedGoals },
    { label: 'Action items', value: analytics.totals.totalActionItems },
    { label: 'Completed items', value: analytics.totals.completedActionItems },
    { label: 'Overdue items', value: analytics.totals.overdueItems },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Analytics</h2>
          <p className="mt-0.5 text-sm text-muted">
            Snapshot of goals, action items, and completion trends.
          </p>
        </div>
        <Button onClick={downloadCsv} variant="secondary" size="md">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={tile.value} />
        ))}
      </div>

      <section className="rounded-lg glass-panel">
        <header className="border-b border-divider px-4 py-3">
          <h3 className="text-sm font-semibold text-fg">Weekly completion trend</h3>
          <p className="mt-0.5 text-xs text-muted">
            Completed action items over the last 7 days.
          </p>
        </header>
        <div className="p-4">
          <AnalyticsChart data={analytics.weeklyCompleted} />
        </div>
      </section>
    </div>
  );
}
