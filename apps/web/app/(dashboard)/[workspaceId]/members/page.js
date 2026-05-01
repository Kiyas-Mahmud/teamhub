'use client';

import { Loader2, Mail, UserPlus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/Can';
import { FormField, Input, Select } from '@/components/ui/Input';
import { usePresenceStore } from '@/stores/presenceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function MembersPage({ params }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const acceptedTokenRef = useRef(null);

  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const fetchWorkspace = useWorkspaceStore((state) => state.fetchWorkspace);
  const inviteMember = useWorkspaceStore((state) => state.inviteMember);
  const acceptInvite = useWorkspaceStore((state) => state.acceptInvite);
  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds);
  const memberships = workspace?.memberships || [];

  useEffect(() => {
    fetchWorkspace(params.workspaceId).catch(() => toast.error('Could not load members'));
  }, [fetchWorkspace, params.workspaceId]);

  useEffect(() => {
    const token = searchParams.get('invite');
    if (!token) return;
    if (acceptedTokenRef.current === token) return;
    acceptedTokenRef.current = token;

    setAcceptingInvite(true);
    acceptInvite(params.workspaceId, token)
      .then(() => {
        toast.success('Invitation accepted — welcome to the workspace');
        // Drop the ?invite=… query param so a refresh doesn't replay it.
        router.replace(pathname);
      })
      .catch((error) => {
        toast.error(error.message || 'Could not accept invite');
        router.replace(pathname);
      })
      .finally(() => setAcceptingInvite(false));
  }, [acceptInvite, params.workspaceId, pathname, router, searchParams]);

  async function handleInvite(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await inviteMember(params.workspaceId, { email, role });
      setEmail('');
      setRole('MEMBER');
      toast.success(`Invitation sent to ${email}`);
    } catch (error) {
      toast.error(error.message || 'Could not send invite');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-fg">
          Members <span className="font-normal text-muted">· {memberships.length}</span>
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Roles are enforced both in the UI and in the API permission matrix.
        </p>
      </div>

      {acceptingInvite && (
        <div className="flex items-center gap-2 rounded-lg glass-panel px-4 py-2.5 text-sm text-fgMuted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          Accepting invitation…
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-lg glass-panel">
          {memberships.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted">No members loaded.</p>
          ) : (
            <ul className="divide-y divide-divider">
              {memberships.map((m) => {
                const online = onlineUserIds.includes(m.user.id);
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surfaceHover"
                  >
                    <Avatar
                      size="md"
                      name={m.user.displayName}
                      src={m.user.avatarUrl}
                      online={online}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {m.user.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">{m.user.email}</p>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">
                      {online ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
                          Online
                        </span>
                      ) : (
                        'Offline'
                      )}
                    </span>
                    <Badge tone={m.role === 'ADMIN' ? 'accent' : 'neutral'}>{m.role}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Can
          action="workspace:invite"
          fallback={
            <aside className="h-fit rounded-lg glass-panel p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted" />
                <h3 className="text-sm font-semibold text-fg">Invites</h3>
              </div>
              <p className="mt-2 text-sm text-muted">
                Only admins can invite teammates to this workspace.
              </p>
            </aside>
          }
        >
          <aside className="h-fit rounded-lg glass-panel p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-muted" />
              <h3 className="text-sm font-semibold text-fg">Invite a teammate</h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              They’ll receive an email with a join link valid for 7 days.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleInvite}>
              <FormField label="Email">
                <Input
                  type="email"
                  placeholder="teammate@teamhub.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Role">
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </FormField>
              <Button type="submit" disabled={submitting || !email} className="w-full">
                {submitting ? 'Sending…' : 'Send invite'}
              </Button>
            </form>
          </aside>
        </Can>
      </div>
    </div>
  );
}
