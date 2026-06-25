'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemeSwitcherProps {
  variant?: 'icon' | 'buttons';
}

export function ThemeSwitcher({ variant = 'icon' }: Readonly<ThemeSwitcherProps>) {
  const { t } = useTranslation('common');
  const { theme, setTheme, toggleTheme } = useTheme();

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-2 px-4 py-2" data-testid="theme-switcher-mobile">
        <SunIcon className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-2.5 py-1 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-pressed={theme === 'light'}
          >
            {t('theme.light')}
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-2.5 py-1 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-pressed={theme === 'dark'}
          >
            {t('theme.dark')}
          </button>
        </div>
      </div>
    );
  }

  const nextThemeLabel = theme === 'dark' ? t('theme.light') : t('theme.dark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
      aria-label={t('theme.toggleTo', { theme: nextThemeLabel })}
      title={t('theme.toggleTo', { theme: nextThemeLabel })}
      data-testid="theme-switcher"
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
