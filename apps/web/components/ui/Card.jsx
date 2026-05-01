import clsx from 'clsx';

export function Card({
  as: Comp = 'div',
  padding = 'md',
  hover = false,
  className,
  ...props
}) {
  const padClass = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  return (
    <Comp
      className={clsx(
        'glass-panel rounded-lg',
        padClass,
        hover && 'transition-colors hover:border-borderStrong',
        className
      )}
      {...props}
    />
  );
}

export function CardSection({ title, description, action, className, children }) {
  return (
    <section className={className}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-fg">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
