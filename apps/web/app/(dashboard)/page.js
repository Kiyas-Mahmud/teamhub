'use client';

import Link from 'next/link';
import { ArrowRight, LayoutGrid, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function DashboardPage() {
  const items = useWorkspaceStore((state) => state.items);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);

  useEffect(() => {
    fetchWorkspaces().catch(() => toast.error('Could not load workspaces'));
  }, [fetchWorkspaces]);

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Pick a space to jump into goals, action items, announcements, and live presence."
        action={
          <Button as={Link} href="/new" size="md">
            <Plus className="h-3.5 w-3.5" />
            New workspace
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No workspaces yet"
          body="Create your first workspace to start tracking goals, announcements, and team action items."
          action={
            <Button as={Link} href="/new">
              <Plus className="h-3.5 w-3.5" />
              Create workspace
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((workspace) => (
            <Link key={workspace.id} href={`/${workspace.id}`} className="group">
              <article className="flex h-full flex-col rounded-lg glass-panel p-4 transition-colors hover:border-borderStrong">
                <div className="flex items-center justify-between">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-md text-sm font-semibold text-white"
                    style={{ background: workspace.accentColor || 'var(--accent)' }}
                  >
                    {workspace.name?.slice(0, 1).toUpperCase() || 'W'}
                  </span>
                  <Badge tone="outline">{workspace.role}</Badge>
                </div>
                <h2 className="mt-4 text-base font-semibold text-fg">{workspace.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {workspace.description || 'Shared team workspace'}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted transition-colors group-hover:text-accent">
                  Open workspace
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
