import clsx from 'clsx';

export function StatTile({ label, value, sub, icon: Icon, className }) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-surface p-4 transition-colors hover:border-borderStrong',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-subtle" />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
