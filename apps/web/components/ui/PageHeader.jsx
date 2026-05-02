import clsx from 'clsx';

export function PageHeader({ title, description, action, breadcrumb, className }) {
  return (
    <div className={clsx('mb-6', className)}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted">
      {items.map((item, idx) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {item.href ? (
            <a href={item.href} className="hover:text-fg">
              {item.label}
            </a>
          ) : (
            <span className={idx === items.length - 1 ? 'text-fg' : ''}>{item.label}</span>
          )}
          {idx < items.length - 1 && <span className="text-subtle">/</span>}
        </span>
      ))}
    </nav>
  );
}
