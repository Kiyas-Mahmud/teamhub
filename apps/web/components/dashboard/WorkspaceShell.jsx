'use client';

import { BarChart3, Bell, CheckSquare, LayoutGrid, Target, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { TabsNav } from '@/components/ui/Tabs';
import { socket } from '@/lib/socket';
import { useSocketSubscribe } from '@/hooks/useSocketSubscribe';
import { useGoalsStore } from '@/stores/goalsStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const sections = [
  { key: '', label: 'Overview', icon: LayoutGrid },
  { key: '/goals', label: 'Goals', icon: Target },
  { key: '/action-items', label: 'Action items', icon: CheckSquare },
  { key: '/announcements', label: 'Announcements', icon: Bell },
  { key: '/members', label: 'Members', icon: Users },
  { key: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function WorkspaceShell({ workspaceId, children }) {
  const pathname = usePathname();
  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const fetchWorkspace = useWorkspaceStore((state) => state.fetchWorkspace);
  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds);

  useEffect(() => {
    fetchWorkspace(workspaceId).catch(() => toast.error('Could not load this workspace'));
  }, [fetchWorkspace, workspaceId]);

  useEffect(() => {
    socket.emit('workspace:join', workspaceId);
    const interval = setInterval(() => {
      socket.emit('presence:heartbeat', workspaceId);
    }, 20_000);
    return () => {
      clearInterval(interval);
      socket.emit('workspace:leave', workspaceId);
    };
  }, [workspaceId]);

  useSocketSubscribe('goal:created', (goal) => useGoalsStore.getState().upsertFromSocket(goal));
  useSocketSubscribe('goal:updated', (goal) => useGoalsStore.getState().upsertFromSocket(goal));
  useSocketSubscribe('goal:deleted', ({ id }) => useGoalsStore.getState().removeFromSocket(id));
  useSocketSubscribe('presence:list', ({ users }) => usePresenceStore.getState().setList(users));
  useSocketSubscribe('presence:online', ({ userId }) => usePresenceStore.getState().add(userId));
  useSocketSubscribe('presence:offline', ({ userId }) =>
    usePresenceStore.getState().remove(userId)
  );

  const memberships = workspace?.memberships || [];
  const onlineCount = memberships.filter((m) => onlineUserIds.includes(m.user.id)).length;

  const tabs = sections.map(({ key, label, icon }) => ({
    href: `/${workspaceId}${key}`,
    label,
    icon,
    active: pathname === `/${workspaceId}${key}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-semibold text-white"
            style={{ background: workspace?.accentColor || 'var(--accent)' }}
          >
            {workspace?.name?.slice(0, 1).toUpperCase() || 'W'}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-fg">
              {workspace?.name || 'Loading…'}
            </h1>
            {workspace?.description && (
              <p className="mt-0.5 truncate text-sm text-muted">{workspace.description}</p>
            )}
          </div>
        </div>
        {memberships.length > 0 && (
          <PresenceStrip
            memberships={memberships}
            onlineUserIds={onlineUserIds}
            onlineCount={onlineCount}
          />
        )}
      </div>

      <TabsNav items={tabs} />

      <div>{children}</div>
    </div>
  );
}

function PresenceStrip({ memberships, onlineUserIds, onlineCount }) {
  const visible = memberships.slice(0, 5);
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-1.5">
        {visible.map((m) => (
          <Avatar
            key={m.id}
            size="sm"
            name={m.user.displayName}
            src={m.user.avatarUrl}
            online={onlineUserIds.includes(m.user.id)}
            className="ring-2 ring-canvas"
          />
        ))}
        {memberships.length > visible.length && (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-surface text-2xs font-medium text-muted ring-2 ring-canvas">
            +{memberships.length - visible.length}
          </span>
        )}
      </div>
      <div className="hidden text-xs text-muted sm:block">
        <span className="font-medium text-fg">{memberships.length}</span> members
        <span className="mx-1.5 text-subtle">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
          {onlineCount} online
        </span>
      </div>
    </div>
  );
}
