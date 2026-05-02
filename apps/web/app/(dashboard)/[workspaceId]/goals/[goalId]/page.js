'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MessageCircle,
  Milestone,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, Input, Select, Textarea } from '@/components/ui/Input';
import { MilestoneProgressBar } from '@/components/ui/MilestoneProgressBar';
import { useGoalsStore } from '@/stores/goalsStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function GoalDetailPage({ params }) {
  const router = useRouter();
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const goal = useGoalsStore((state) => state.currentGoal);
  const fetchGoal = useGoalsStore((state) => state.fetchGoal);
  const updateGoal = useGoalsStore((state) => state.update);
  const removeGoal = useGoalsStore((state) => state.remove);
  const addMilestone = useGoalsStore((state) => state.addMilestone);
  const updateMilestone = useGoalsStore((state) => state.updateMilestone);
  const deleteMilestone = useGoalsStore((state) => state.deleteMilestone);
  const addUpdate = useGoalsStore((state) => state.addUpdate);

  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const members = (workspace?.memberships || []).map((m) => m.user).filter(Boolean);

  useEffect(() => {
    fetchGoal(params.workspaceId, params.goalId).catch(() =>
      toast.error('Could not load goal')
    );
  }, [fetchGoal, params.goalId, params.workspaceId]);

  async function handleMilestone(event) {
    event.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      await addMilestone(params.workspaceId, params.goalId, {
        title: milestoneTitle.trim(),
        progress: 0,
      });
      setMilestoneTitle('');
      toast.success('Milestone added');
    } catch {}
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!updateContent.trim()) return;
    try {
      await addUpdate(params.workspaceId, params.goalId, updateContent.trim());
      setUpdateContent('');
      toast.success('Update posted');
    } catch {}
  }

  async function handleDeleteMilestone(milestoneId) {
    if (!deleteMilestone) return;
    try {
      await deleteMilestone(params.workspaceId, params.goalId, milestoneId);
    } catch {}
  }

  async function handleDeleteGoal() {
    setDeleting(true);
    try {
      await removeGoal(params.workspaceId, params.goalId);
      toast.success('Goal deleted');
      router.push(`/${params.workspaceId}/goals`);
    } catch {
      setDeleting(false);
    }
  }

  const milestones = goal?.milestones || [];
  const updates = goal?.updates || [];

  return (
    <div className="space-y-6">
      <Link
        href={`/${params.workspaceId}/goals`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to goals
      </Link>

      <div className="rounded-lg glass-panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-fg">
              {goal?.title || 'Loading…'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {goal?.description || 'No description yet.'}
            </p>
            {goal && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Avatar size="xs" name={goal.owner?.displayName} src={goal.owner?.avatarUrl} />
                  <span className="text-fgMuted">{goal.owner?.displayName || 'Unknown'}</span>
                </span>
                {goal.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(goal.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={goal?.status || 'ACTIVE'} />
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            {confirmDelete ? (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteGoal}
                  disabled={deleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? 'Deleting…' : 'Confirm'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-[color:var(--danger)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg glass-panel">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Milestone className="h-3.5 w-3.5 text-muted" />
              <h3 className="text-sm font-semibold text-fg">Milestones</h3>
              <span className="text-xs text-muted">{milestones.length}</span>
            </div>
          </header>

          <form onSubmit={handleMilestone} className="flex gap-2 border-b border-border p-3">
            <Input
              placeholder="Add a milestone"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
            />
            <Button type="submit" disabled={!milestoneTitle.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </form>

          <div className="divide-y divide-divider">
            {milestones.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted">
                No milestones yet. Break this goal into steps.
              </p>
            ) : (
              milestones.map((milestone) => (
                <div key={milestone.id} className="group px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                      {milestone.title}
                    </p>
                    <span className="text-xs font-semibold text-accent tabular-nums">
                      {milestone.progress}%
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete milestone ${milestone.title}`}
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="grid h-6 w-6 place-items-center rounded text-muted opacity-0 transition-opacity hover:bg-surfaceHover hover:text-[color:var(--danger)] group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <MilestoneProgressBar
                      value={milestone.progress}
                      ariaLabel={`Progress for ${milestone.title}`}
                      onChange={(next) =>
                        updateMilestone(params.workspaceId, params.goalId, milestone.id, {
                          progress: next,
                        }).catch(() => {})
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg glass-panel">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-muted" />
              <h3 className="text-sm font-semibold text-fg">Activity</h3>
              <span className="text-xs text-muted">{updates.length}</span>
            </div>
          </header>

          <form onSubmit={handleUpdate} className="space-y-2 border-b border-border p-3">
            <Textarea
              placeholder="Share a progress update"
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!updateContent.trim()}>
                Post update
              </Button>
            </div>
          </form>

          <div className="divide-y divide-divider">
            {updates.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted">
                No updates yet. Post the first note.
              </p>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="flex gap-3 px-4 py-3">
                  <Avatar
                    size="sm"
                    name={update.author?.displayName}
                    src={update.author?.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-fg">{update.content}</p>
                    <p className="mt-1 text-xs text-muted">
                      <span className="font-medium text-fgMuted">
                        {update.author?.displayName || 'Unknown'}
                      </span>
                      <span className="mx-1.5 text-subtle">·</span>
                      {new Date(update.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <Drawer
        open={editing && !!goal}
        onClose={() => setEditing(false)}
        title="Edit goal"
        description="Update the title, owner, status, due date, or description."
      >
        {goal && (
          <EditGoalForm
            key={goal.id}
            goal={goal}
            members={members}
            onCancel={() => setEditing(false)}
            onSave={async (patch) => {
              try {
                await updateGoal(params.workspaceId, params.goalId, patch);
                toast.success('Goal updated');
                setEditing(false);
              } catch {}
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function EditGoalForm({ goal, members, onSave, onCancel }) {
  const [title, setTitle] = useState(goal.title || '');
  const [description, setDescription] = useState(goal.description || '');
  const [status, setStatus] = useState(goal.status || 'ACTIVE');
  const [ownerId, setOwnerId] = useState(goal.ownerId || goal.owner?.id || '');
  const [dueDate, setDueDate] = useState(
    goal.dueDate ? new Date(goal.dueDate).toISOString().slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      ownerId: ownerId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : '',
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      </FormField>

      <FormField label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </FormField>
        <FormField label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Owner">
        <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          {members.length === 0 && (
            <option value={ownerId}>{goal.owner?.displayName || 'Current owner'}</option>
          )}
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
