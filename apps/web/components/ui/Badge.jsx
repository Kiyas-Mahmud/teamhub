import clsx from 'clsx';

const tones = {
  neutral: 'bg-surfaceSoft text-fgMuted border border-border',
  accent: 'bg-accentSoft text-accent border border-transparent',
  success: 'bg-successSoft text-[color:var(--success)] border border-transparent',
  warning: 'bg-warningSoft text-[color:var(--warning)] border border-transparent',
  danger: 'bg-dangerSoft text-[color:var(--danger)] border border-transparent',
  outline: 'bg-transparent text-muted border border-border',
};

export function Badge({ tone = 'neutral', className, children, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const statusMap = {
  TODO: { label: 'Todo', tone: 'neutral' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  DONE: { label: 'Done', tone: 'success' },
  ACTIVE: { label: 'Active', tone: 'accent' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  PAUSED: { label: 'Paused', tone: 'neutral' },
  ARCHIVED: { label: 'Archived', tone: 'outline' },
};

export function StatusBadge({ status, className }) {
  const meta = statusMap[status] || { label: status, tone: 'neutral' };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function StatusDot({ status, className }) {
  const color = {
    TODO: 'bg-subtle',
    IN_PROGRESS: 'bg-[color:var(--warning)]',
    DONE: 'bg-[color:var(--success)]',
  }[status] || 'bg-subtle';
  return <span className={clsx('inline-block h-1.5 w-1.5 rounded-full', color, className)} />;
}
