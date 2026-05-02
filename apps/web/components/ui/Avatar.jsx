import Image from 'next/image';
import clsx from 'clsx';

const sizes = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-20 w-20 text-xl',
};

const palette = ['#0d9488', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

function colorFor(seed = '?') {
  const code = seed.charCodeAt(0) || 0;
  return palette[code % palette.length];
}

export function Avatar({ src, alt, name, size = 'md', online = false, className }) {
  const initial = (name || alt || '?').slice(0, 1).toUpperCase();
  const sizeClass = sizes[size];
  const bg = colorFor(name || alt || '?');
  const isLocalPreview =
    typeof src === 'string' && /^(blob:|data:)|\.svg(\?|$)|api\.dicebear\.com/.test(src);

  return (
    <span className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <Image
          alt={alt || name || 'Avatar'}
          src={src}
          width={80}
          height={80}
          unoptimized={isLocalPreview}
          className={clsx(sizeClass, 'rounded-full object-cover')}
        />
      ) : (
        <span
          className={clsx(
            sizeClass,
            'inline-flex items-center justify-center rounded-full font-medium text-white'
          )}
          style={{ background: bg }}
        >
          {initial}
        </span>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[color:var(--success)] ring-2 ring-bg" />
      )}
    </span>
  );
}
