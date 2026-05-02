'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, MessageCircle, Milestone, Plus, Target, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField, Input, Select, Textarea } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function GoalsPage({ params }) {
  const [showCompose, setShowCompose] = useState(false);
  const goals = useGoalsStore(
    useShallow((state) => state.ids.map((id) => state.byId[id]).filter(Boolean))
  );
  const fetchGoals = useGoalsStore((state) => state.fetchGoals);

  useEffect(() => {
    fetchGoals(params.workspaceId).catch(() => toast.error('Could not load goals'));
  }, [fetchGoals, params.workspaceId]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">
            Goals <span className="font-normal text-muted">· {goals.length}</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            What the team is driving — milestones and progress live here.
          </p>
        </div>
        <Button onClick={() => setShowCompose((open) => !open)} size="md">
          <Plus className="h-3.5 w-3.5" />
          New goal
        </Button>
      </div>

      {showCompose && (
        <ComposeGoal
          workspaceId={params.workspaceId}
          onClose={() => setShowCompose(false)}
        />
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          body="Create your first goal to give the team a clear, shared target."
          action={
            <Button onClick={() => setShowCompose(true)}>
              <Plus className="h-3.5 w-3.5" />
              New goal
            </Button>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-lg glass-panel">
          {goals.map((goal, index) => (
            <li
              key={goal.id}
              className={index > 0 ? 'border-t border-border' : ''}
            >
              <GoalRow goal={goal} workspaceId={params.workspaceId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ComposeGoal({ workspaceId, onClose }) {
  const currentUser = useAuthStore((state) => state.user);
  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const members = (workspace?.memberships || []).map((m) => m.user).filter(Boolean);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [ownerId, setOwnerId] = useState(currentUser?.id || '');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const createGoal = useGoalsStore((state) => state.create);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createGoal(workspaceId, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : '',
        ownerId: ownerId || undefined,
        status,
      });
      toast.success('Goal created');
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg glass-panel p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">New goal</h3>
          <p className="mt-0.5 text-xs text-muted">
            A clear title is enough to start. You can refine later.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surfaceHover hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <FormField label="Title" className="md:col-span-2">
          <Input
            placeholder="Launch onboarding redesign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="Description" className="md:col-span-2">
          <Textarea
            placeholder="What does success look like?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </FormField>
        <FormField
          label="Owner"
          className="md:col-span-2"
          hint="Defaults to you. Pick another teammate to hand it off."
        >
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {members.length === 0 && currentUser && (
              <option value={currentUser.id}>{currentUser.displayName}</option>
            )}
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
                {currentUser?.id === m.id ? ' (you)' : ''}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || submitting}>
          {submitting ? 'Creating…' : 'Create goal'}
        </Button>
      </div>
    </form>
  );
}

function GoalRow({ goal, workspaceId }) {
  const milestoneCount = goal.milestones?.length || 0;
  const progress =
    milestoneCount === 0
      ? 0
      : Math.round(
          goal.milestones.reduce((sum, m) => sum + (m.progress || 0), 0) / milestoneCount
        );

  return (
    <Link
      href={`/${workspaceId}/goals/${goal.id}`}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surfaceHover"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-fg">{goal.title}</h3>
          <StatusBadge status={goal.status} />
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
          {goal.description || 'No description'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Avatar size="xs" name={goal.owner?.displayName} src={goal.owner?.avatarUrl} />
            <span className="text-fgMuted">{goal.owner?.displayName || 'Unknown'}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Milestone className="h-3 w-3" />
            {milestoneCount} milestones
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {goal.updates?.length || 0} updates
          </span>
          {goal.dueDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(goal.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="hidden w-40 sm:block">
        <div className="flex items-center justify-between text-2xs text-muted">
          <span>Progress</span>
          <span className="font-medium text-fg">{progress}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-surfaceHover">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-subtle transition-colors group-hover:text-accent" />
    </Link>
  );
}
