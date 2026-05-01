import clsx from 'clsx';

export function EmptyState({ icon: Icon, title, body, action, className }) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center rounded-lg border border-dashed border-borderStrong bg-surfaceSoft px-6 py-12 text-center',
        className
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
