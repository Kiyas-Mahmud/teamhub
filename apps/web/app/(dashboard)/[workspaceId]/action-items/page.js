'use client';

import clsx from 'clsx';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  KanbanSquare,
  List,
  Loader2,
  Plus,
  Target,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField, Input, Select, Textarea } from '@/components/ui/Input';
import { useActionItemsStore } from '@/stores/actionItemsStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const columns = [
  { key: 'TODO', label: 'Todo', icon: Circle, color: 'text-subtle' },
  { key: 'IN_PROGRESS', label: 'In progress', icon: Loader2, color: 'text-[color:var(--warning)]' },
  { key: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-[color:var(--success)]' },
];

const priorities = [
  { value: 'LOW', label: 'Low', tone: 'neutral' },
  { value: 'MEDIUM', label: 'Medium', tone: 'neutral' },
  { value: 'HIGH', label: 'High', tone: 'warning' },
  { value: 'URGENT', label: 'Urgent', tone: 'danger' },
];

function statusMeta(status) {
  return columns.find((c) => c.key === status) || columns[0];
}

function priorityMeta(value) {
  return priorities.find((p) => p.value === value) || priorities[1];
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(item) {
  return (
    item.dueDate && item.status !== 'DONE' && new Date(item.dueDate) < new Date()
  );
}

export default function ActionItemsPage({ params }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [view, setView] = useState('kanban');
  const [editingId, setEditingId] = useState(null);

  const items = useActionItemsStore((state) => state.items);
  const filters = useActionItemsStore((state) => state.filters);
  const setFilters = useActionItemsStore((state) => state.setFilters);
  const fetchItems = useActionItemsStore((state) => state.fetchItems);
  const createItem = useActionItemsStore((state) => state.create);
  const updateItem = useActionItemsStore((state) => state.update);
  const removeItem = useActionItemsStore((state) => state.remove);

  const goals = useGoalsStore(
    useShallow((state) => state.ids.map((id) => state.byId[id]).filter(Boolean))
  );
  const fetchGoals = useGoalsStore((state) => state.fetchGoals);
  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const memberships = workspace?.memberships || [];

  useEffect(() => {
    fetchItems(params.workspaceId).catch(() => toast.error('Could not load action items'));
    fetchGoals(params.workspaceId).catch(() => {});
  }, [fetchItems, fetchGoals, params.workspaceId]);

  const grouped = useMemo(
    () =>
      columns.reduce((acc, col) => {
        acc[col.key] = items.filter((item) => item.status === col.key);
        return acc;
      }, {}),
    [items]
  );

  const sortedForList = useMemo(() => {
    const order = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };
    return [...items].sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDue - bDue;
    });
  }, [items]);

  const editingItem = items.find((i) => i.id === editingId) || null;

  async function handleCreate(event) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error('Add a title first');
      return;
    }
    try {
      await createItem(params.workspaceId, {
        title: title.trim(),
        description: description.trim(),
      });
      setTitle('');
      setDescription('');
      toast.success('Action item created');
    } catch {}
  }

  function refreshWithFilters(nextFilters) {
    setFilters(nextFilters);
    fetchItems(params.workspaceId, { ...filters, ...nextFilters }).catch(() =>
      toast.error('Could not filter items')
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">
            Action items <span className="font-normal text-muted">· {items.length}</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Capture work, move it across the board, and surface blockers fast.
          </p>
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>

      <form
        onSubmit={handleCreate}
        className="grid items-center gap-2 rounded-lg glass-panel p-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto_minmax(0,140px)]"
      >
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 bg-transparent shadow-none focus:shadow-none"
        />
        <Input
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-0 bg-transparent shadow-none focus:shadow-none"
        />
        <Button type="submit" disabled={!title.trim()} size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
        <Select
          value={filters.status}
          onChange={(e) => refreshWithFilters({ status: e.target.value })}
          className="h-8"
        >
          <option value="">All statuses</option>
          <option value="TODO">Todo</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </Select>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Circle}
          title="No action items yet"
          body="Add the first task above. It will show up in the Todo column."
        />
      ) : view === 'kanban' ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              items={grouped[col.key] || []}
              workspaceId={params.workspaceId}
              updateItem={updateItem}
              onOpenEdit={setEditingId}
            />
          ))}
        </div>
      ) : (
        <ListView items={sortedForList} onOpenEdit={setEditingId} goals={goals} />
      )}

      <Drawer
        open={Boolean(editingItem)}
        onClose={() => setEditingId(null)}
        title="Edit action item"
        description="Update assignee, priority, status, due date, or parent goal."
      >
        {editingItem && (
          <EditForm
            key={editingItem.id}
            item={editingItem}
            goals={goals}
            memberships={memberships}
            workspaceId={params.workspaceId}
            onSave={async (patch) => {
              try {
                await updateItem(params.workspaceId, editingItem.id, patch);
                toast.success('Action item updated');
                setEditingId(null);
              } catch {}
            }}
            onDelete={async () => {
              try {
                await removeItem(params.workspaceId, editingItem.id);
                toast.success('Action item deleted');
                setEditingId(null);
              } catch {}
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  return (
    <div className="inline-flex items-center rounded-md glass-panel p-0.5 text-sm">
      {[
        { key: 'kanban', label: 'Board', icon: KanbanSquare },
        { key: 'list', label: 'List', icon: List },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setView(key)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
            view === key
              ? 'bg-surface text-fg shadow-sm'
              : 'text-muted hover:text-fg'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function KanbanColumn({ column, items, workspaceId, updateItem, onOpenEdit }) {
  const Icon = column.icon;
  return (
    <section className="flex min-h-[180px] flex-col rounded-lg glass-soft">
      <header className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Icon className={clsx('h-3.5 w-3.5', column.color)} />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg">
            {column.label}
          </h3>
          <span className="rounded bg-surface px-1.5 py-0.5 text-2xs font-semibold text-muted">
            {items.length}
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-2 p-2 pt-0">
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
            {column.key === 'TODO'
              ? 'No tasks waiting'
              : column.key === 'IN_PROGRESS'
                ? 'Nothing actively moving'
                : 'Completed work lands here'}
          </p>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              workspaceId={workspaceId}
              updateItem={updateItem}
              onOpenEdit={onOpenEdit}
            />
          ))
        )}
      </div>
    </section>
  );
}

function KanbanCard({ item, workspaceId, updateItem, onOpenEdit }) {
  const overdue = isOverdue(item);
  const pri = priorityMeta(item.priority);

  return (
    <article
      className="group cursor-pointer rounded-md glass-panel p-3 transition-colors hover:border-borderStrong"
      onClick={() => onOpenEdit(item.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-sm font-medium leading-snug text-fg">{item.title}</p>
        {item.priority && item.priority !== 'MEDIUM' && (
          <Badge tone={pri.tone} className="shrink-0">
            {pri.label}
          </Badge>
        )}
      </div>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
      )}

      {(item.assignee || item.dueDate || item.goal) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-2xs text-muted">
          {item.assignee && (
            <span className="inline-flex items-center gap-1">
              <Avatar
                size="xs"
                name={item.assignee.displayName}
                src={item.assignee.avatarUrl}
              />
              <span className="text-fgMuted">{item.assignee.displayName}</span>
            </span>
          )}
          {item.dueDate && (
            <span
              className={clsx(
                'inline-flex items-center gap-1',
                overdue && 'text-[color:var(--danger)]'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(item.dueDate)}
              {overdue && <AlertCircle className="h-3 w-3" />}
            </span>
          )}
          {item.goal && (
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" />
              {item.goal.title}
            </span>
          )}
        </div>
      )}

      <div
        className="mt-3 flex flex-wrap gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            onClick={() =>
              updateItem(workspaceId, item.id, { status: col.key }).catch(() => {})
            }
            className={clsx(
              'rounded px-1.5 py-0.5 text-2xs font-medium transition-colors',
              item.status === col.key
                ? 'bg-accent text-[color:var(--accent-contrast)]'
                : 'bg-surfaceSoft text-muted hover:bg-surfaceHover hover:text-fg'
            )}
          >
            {col.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function ListView({ items, onOpenEdit }) {
  return (
    <div className="overflow-hidden rounded-lg glass-panel">
      <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_120px_140px] gap-3 border-b border-divider px-4 py-2.5 text-2xs font-medium uppercase tracking-wider text-muted sm:grid">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Due</span>
        <span>Assignee</span>
      </div>
      <ul className="divide-y divide-divider">
        {items.map((item) => {
          const status = statusMeta(item.status);
          const StatusIcon = status.icon;
          const pri = priorityMeta(item.priority);
          const overdue = isOverdue(item);
          return (
            <li
              key={item.id}
              className="cursor-pointer transition-colors hover:bg-surfaceHover"
              onClick={() => onOpenEdit(item.id)}
            >
              <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_140px_120px_120px_140px] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                      {item.description}
                    </p>
                  )}
                  {item.goal && (
                    <p className="mt-1 inline-flex items-center gap-1 text-2xs text-muted">
                      <Target className="h-3 w-3" />
                      {item.goal.title}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <StatusIcon className={clsx('h-3.5 w-3.5', status.color)} />
                  <span className="text-fgMuted">{status.label}</span>
                </span>
                <span>
                  <Badge tone={pri.tone}>{pri.label}</Badge>
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 text-xs',
                    overdue ? 'text-[color:var(--danger)]' : 'text-muted'
                  )}
                >
                  {item.dueDate ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.dueDate)}
                      {overdue && <AlertCircle className="h-3 w-3" />}
                    </>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  {item.assignee ? (
                    <>
                      <Avatar
                        size="xs"
                        name={item.assignee.displayName}
                        src={item.assignee.avatarUrl}
                      />
                      <span className="truncate text-fgMuted">
                        {item.assignee.displayName}
                      </span>
                    </>
                  ) : (
                    <span className="text-subtle">Unassigned</span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EditForm({ item, goals, memberships, onSave, onDelete }) {
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [status, setStatus] = useState(item.status || 'TODO');
  const [priority, setPriority] = useState(item.priority || 'MEDIUM');
  const [assigneeId, setAssigneeId] = useState(item.assigneeId || '');
  const [goalId, setGoalId] = useState(item.goalId || '');
  const [dueDate, setDueDate] = useState(
    item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId: assigneeId || '',
      goalId: goalId || '',
      dueDate: dueDate ? new Date(dueDate).toISOString() : '',
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <FormField label="Title">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
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
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Due date">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </FormField>

      <FormField label="Assignee">
        <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          <option value="">Unassigned</option>
          {memberships.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.displayName}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Parent goal" hint="Optional. Link this task to a goal.">
        <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">No goal</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="flex items-center justify-between gap-2 pt-2">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Confirm delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-[color:var(--danger)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
        <Button type="submit" disabled={!title.trim() || saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
