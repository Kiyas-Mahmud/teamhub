import clsx from 'clsx';

const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Render text containing @[Name](userId) markers as a mix of plain text + chips.
 * Highlights mentions that target the current viewer.
 */
export function MentionText({ text, currentUserId, className }) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  let match;
  let key = 0;

  // Reset state — RegExp with /g keeps lastIndex.
  MENTION_PATTERN.lastIndex = 0;
  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    const [whole, name, userId] = match;
    if (match.index > last) {
      parts.push(<span key={`t${key++}`}>{text.slice(last, match.index)}</span>);
    }
    const isSelf = currentUserId && userId === currentUserId;
    parts.push(
      <span
        key={`m${key++}`}
        className={clsx(
          'inline-flex items-center rounded px-1 py-0.5 text-xs font-medium',
          isSelf
            ? 'bg-accent text-[color:var(--accent-contrast)]'
            : 'bg-accentSoft text-accent'
        )}
        data-user-id={userId}
      >
        @{name}
      </span>
    );
    last = match.index + whole.length;
  }
  if (last < text.length) {
    parts.push(<span key={`t${key++}`}>{text.slice(last)}</span>);
  }

  return <span className={className}>{parts}</span>;
}
