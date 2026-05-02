'use client';

import clsx from 'clsx';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';

/**
 * Single-line input with @mention autocomplete.
 *
 * What the user sees:    "Hey @kiyas can you collect this?"
 * What the parent gets:  "Hey @[kiyas](cmooo7jju...) can you collect this?"
 *
 * The canonical wire format @[Name](userId) is what the server's
 * parseMentionUserIds() expects — but the user-facing input is kept clean.
 *
 * Keyboard:
 *   ↑ / ↓   navigate suggestions
 *   Enter   pick the active suggestion (or submit if dropdown is closed)
 *   Esc     close dropdown
 */

const CANONICAL_TOKEN = /@\[([^\]]+)\]\(([^)]+)\)/g;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// "Hi @[kiyas](id123) cool" -> visible: "Hi @kiyas cool", with (kiyas, id123) added to map
function canonicalToVisible(canonical, mentionMap) {
  if (!canonical) return '';
  return canonical.replace(CANONICAL_TOKEN, (_, name, id) => {
    mentionMap.set(name, id);
    return `@${name}`;
  });
}

// "Hi @kiyas cool" + map -> "Hi @[kiyas](id123) cool". Longest names first
// so "@Demo Admin" beats "@Demo".
function visibleToCanonical(visible, mentionMap) {
  if (!visible || mentionMap.size === 0) return visible;
  const entries = [...mentionMap.entries()].sort((a, b) => b[0].length - a[0].length);
  let out = visible;
  for (const [name, id] of entries) {
    // Match @<name> only when it's not already wrapped in canonical brackets
    // and the trailing boundary is end-of-string, whitespace, or punctuation.
    const pattern = new RegExp(`@${escapeRegex(name)}(?![A-Za-z0-9._\\-])`, 'g');
    out = out.replace(pattern, `@[${name}](${id})`);
  }
  return out;
}

export const MentionInput = forwardRef(function MentionInput(
  {
    value,
    onChange,
    onSubmit,
    members = [],
    placeholder,
    disabled = false,
    className,
    autoFocus = false,
  },
  ref
) {
  const inputRef = useRef(null);
  const mentionMap = useRef(new Map()); // displayName -> userId
  const [draft, setDraft] = useState(() =>
    canonicalToVisible(value || '', mentionMap.current)
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [tokenStart, setTokenStart] = useState(-1);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      mentionMap.current.clear();
      setDraft('');
      onChange?.('');
      closeDropdown();
    },
  }));

  // If the parent resets `value` externally (e.g. clearing after submit),
  // keep our internal draft in sync. We only re-derive the draft when the
  // canonical form coming back doesn't match what we'd have produced.
  useEffect(() => {
    const externalCanonical = value || '';
    const ourCanonical = visibleToCanonical(draft, mentionMap.current);
    if (externalCanonical !== ourCanonical) {
      if (externalCanonical === '') {
        mentionMap.current.clear();
        setDraft('');
      } else {
        // Parent supplied a fresh canonical value — adopt it.
        const fresh = new Map();
        const visible = canonicalToVisible(externalCanonical, fresh);
        mentionMap.current = fresh;
        setDraft(visible);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function closeDropdown() {
    setOpen(false);
    setQuery('');
    setTokenStart(-1);
    setActiveIndex(0);
  }

  function detectMention(nextValue, caret) {
    const upto = nextValue.slice(0, caret);
    const at = upto.lastIndexOf('@');
    if (at === -1) return { open: false };

    const between = upto.slice(at + 1);
    const charBefore = at === 0 ? '' : nextValue[at - 1];
    if (charBefore && !/\s/.test(charBefore)) return { open: false };
    if (!/^[a-zA-Z0-9._\- ]*$/.test(between)) return { open: false };
    if (between.length > 30) return { open: false };
    return { open: true, query: between, tokenStart: at };
  }

  function emit(nextDraft) {
    setDraft(nextDraft);
    onChange?.(visibleToCanonical(nextDraft, mentionMap.current));
  }

  function handleChange(event) {
    const next = event.target.value;
    emit(next);
    const caret = event.target.selectionStart || next.length;
    const detection = detectMention(next, caret);
    if (detection.open) {
      setOpen(true);
      setQuery(detection.query);
      setTokenStart(detection.tokenStart);
      setActiveIndex(0);
    } else {
      closeDropdown();
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => m && m.id && m.displayName)
      .filter((m) => (q ? m.displayName.toLowerCase().includes(q) : true))
      .slice(0, 6);
  }, [members, query]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  function pick(member) {
    if (!member || tokenStart < 0) return;
    const before = draft.slice(0, tokenStart);
    const after = draft.slice(tokenStart + 1 + query.length);
    const visibleInsert = `@${member.displayName} `;
    const next = `${before}${visibleInsert}${after}`;
    mentionMap.current.set(member.displayName, member.id);
    emit(next);
    closeDropdown();

    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const caret = (before + visibleInsert).length;
      el.focus();
      try {
        el.setSelectionRange(caret, caret);
      } catch (_) {}
    });
  }

  function handleKeyDown(event) {
    if (open && filtered.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pick(filtered[activeIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown();
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className={clsx('relative w-full', className)}>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => closeDropdown(), 120);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="h-9 w-full input-base px-3 py-2 text-sm text-fg placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60"
      />

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 z-30 mb-1 w-72 max-w-full overflow-hidden rounded-lg border border-borderStrong bg-surface shadow-popover"
        >
          <li className="border-b border-divider px-2.5 py-1.5 text-2xs font-medium uppercase tracking-wider text-subtle">
            Mention a teammate
          </li>
          {filtered.map((member, i) => {
            const active = i === activeIndex;
            return (
              <li key={member.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(member)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={clsx(
                    'flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm transition-colors',
                    active ? 'bg-accentSoft text-fg' : 'text-fgMuted hover:bg-surfaceHover'
                  )}
                >
                  <Avatar size="sm" name={member.displayName} src={member.avatarUrl} />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {member.displayName}
                  </span>
                  {member.email && (
                    <span className="truncate text-2xs text-muted">{member.email}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
