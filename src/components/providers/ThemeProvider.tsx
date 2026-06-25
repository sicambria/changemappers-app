'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ColorTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'cm_color_theme';

interface ThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

function isColorTheme(value: string | null): value is ColorTheme {
  return value === 'light' || value === 'dark';
}

function applyDocumentTheme(theme: ColorTheme) {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [theme, setThemeState] = useState<ColorTheme>('light');

  useEffect(() => {
    let nextTheme: ColorTheme = 'light';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (isColorTheme(stored)) {
        nextTheme = stored;
      }
    } catch {
      // Keep the app default when storage is unavailable.
    }

    setThemeState(nextTheme);
    applyDocumentTheme(nextTheme);
  }, []);

  const setTheme = useCallback((nextTheme: ColorTheme) => {
    setThemeState(nextTheme);
    applyDocumentTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Theme switching should still work for the current page without storage.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const contextValue = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
