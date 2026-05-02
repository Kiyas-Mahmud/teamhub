'use client';

import { useEffect } from 'react';
import { applyTheme, getPreferredTheme, THEME_STORAGE_KEY } from '@/lib/theme';
import { useUiStore } from '@/stores/uiStore';

export function ThemeProvider({ children }) {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (!stored) {
        const nextTheme = event.matches ? 'dark' : 'light';
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return children;
}
