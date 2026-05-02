'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceCreateSchema } from '@team-hub/shared/validators';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const presetColors = [
  '#0d9488',
  '#6366f1',
  '#0ea5e9',
  '#f59e0b',
  '#ec4899',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
];

export default function NewWorkspacePage() {
  const router = useRouter();
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workspaceCreateSchema),
    defaultValues: { accentColor: '#0d9488' },
  });

  const watchedColor = watch('accentColor') || '#0d9488';
  const watchedName = watch('name') || 'Your workspace';
  const watchedDescription = watch('description');

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const workspace = await createWorkspace(values);
      toast.success('Workspace created');
      router.push(`/${workspace.id}`);
    } catch (error) {
      toast.error(error.message || 'Could not create workspace');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New workspace"
        description="Workspaces are isolated. Each has its own goals, action items, announcements, and members."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg glass-panel p-5">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField label="Workspace name" error={errors.name?.message}>
              <Input placeholder="Product Launch" {...register('name')} />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
              <Textarea
                placeholder="What is this workspace organizing?"
                {...register('description')}
              />
            </FormField>

            <FormField label="Accent color" error={errors.accentColor?.message}>
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => {
                    const active = watchedColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setValue('accentColor', color, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        aria-label={`Use ${color}`}
                        className="relative h-7 w-7 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: color,
                          boxShadow: active
                            ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}`
                            : 'none',
                        }}
                      />
                    );
                  })}
                </div>
                <Input className="font-mono text-xs" {...register('accentColor')} />
              </div>
            </FormField>

            <div className="pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create workspace'}
              </Button>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-lg glass-panel p-4">
          <p className="text-2xs font-medium uppercase tracking-wider text-subtle">
            Preview
          </p>
          <div className="mt-3 rounded-md border border-border bg-surfaceSoft p-3">
            <div className="flex items-center justify-between">
              <span
                className="grid h-8 w-8 place-items-center rounded-md text-sm font-semibold text-white"
                style={{ background: watchedColor }}
              >
                {watchedName.slice(0, 1).toUpperCase()}
              </span>
              <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-2xs font-medium text-muted">
                Admin
              </span>
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-fg">{watchedName}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
              {watchedDescription || 'Shared team workspace'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
