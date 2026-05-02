'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

const QUICK_VALUES = [0, 25, 50, 75, 100];

/**
 * Click + drag + keyboard progress bar for goal milestones.
 *
 * - The colored fill IS the slider (click anywhere on the track to set).
 * - Drag the handle to scrub. Local state updates instantly; the API call
 *   only fires on release so we don't spam PATCHes during a drag.
 * - Quick-set chips below for 0 / 25 / 50 / 75 / 100.
 * - Arrow keys (←/→) move by 1; Shift+arrow by 10.
 */
export function MilestoneProgressBar({ value = 0, onChange, ariaLabel }) {
  const [drafting, setDrafting] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const trackRef = useRef(null);
  const draftRef = useRef(value);

  // Keep local state in sync with prop unless we're mid-drag.
  useEffect(() => {
    if (!drafting) {
      setDraftValue(value);
      draftRef.current = value;
    }
  }, [value, drafting]);

  const display = drafting ? draftValue : value;

  function valueAtPointer(event) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return display;
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    return Math.round((x / rect.width) * 100);
  }

  function commit(next) {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    if (clamped !== value) onChange?.(clamped);
  }

  function handlePointerDown(event) {
    event.preventDefault();
    trackRef.current?.setPointerCapture?.(event.pointerId);
    const next = valueAtPointer(event);
    setDrafting(true);
    setDraftValue(next);
    draftRef.current = next;
  }

  function handlePointerMove(event) {
    if (!drafting) return;
    const next = valueAtPointer(event);
    setDraftValue(next);
    draftRef.current = next;
  }

  function handlePointerUp(event) {
    if (!drafting) return;
    try {
      trackRef.current?.releasePointerCapture?.(event.pointerId);
    } catch (_) {}
    const final = draftRef.current;
    setDrafting(false);
    commit(final);
  }

  function handleKeyDown(event) {
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      commit(value + step);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      commit(value - step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      commit(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      commit(100);
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel || 'Milestone progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={display}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={clsx(
          'group relative h-2 w-full cursor-pointer rounded-full bg-surfaceHover focus-ring',
          drafting && 'cursor-grabbing'
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r from-accent to-accentHover',
            drafting ? 'transition-none' : 'transition-[width] duration-150'
          )}
          style={{ width: `${display}%` }}
        />
        <span
          aria-hidden
          className={clsx(
            'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent shadow-sm',
            drafting ? 'scale-110 transition-none' : 'transition-[left] duration-150',
            'group-hover:scale-110'
          )}
          style={{ left: `${display}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {QUICK_VALUES.map((q) => {
          const active = display === q;
          return (
            <button
              key={q}
              type="button"
              onClick={() => commit(q)}
              className={clsx(
                'inline-flex h-6 min-w-[34px] items-center justify-center rounded px-1.5 text-2xs font-medium transition-colors',
                active
                  ? 'bg-accent text-[color:var(--accent-contrast)]'
                  : 'bg-surfaceSoft text-muted hover:bg-surfaceHover hover:text-fg'
              )}
            >
              {q}%
            </button>
          );
        })}
      </div>
    </div>
  );
}
