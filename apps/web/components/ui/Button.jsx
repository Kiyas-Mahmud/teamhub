import clsx from 'clsx';

const variants = {
  primary:
    'bg-accent text-[color:var(--accent-contrast)] hover:bg-accentHover',
  secondary:
    'bg-surface text-fg border border-border hover:bg-surfaceHover hover:border-borderStrong',
  ghost:
    'bg-transparent text-fg hover:bg-surfaceHover',
  outline:
    'bg-transparent text-fg border border-borderStrong hover:bg-surfaceHover',
  danger:
    'bg-[color:var(--danger)] text-white hover:opacity-90',
  link:
    'bg-transparent text-accent hover:underline px-0',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 p-0',
  iconSm: 'h-8 w-8 p-0',
};

export function Button({
  as: Comp = 'button',
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) {
  return (
    <Comp
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-100 focus-visible:outline-none focus-ring disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
        variants[variant],
        className
      )}
      type={Comp === 'button' ? type : undefined}
      {...props}
    />
  );
}
