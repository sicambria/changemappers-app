'use client';

import { useSyncExternalStore } from 'react';
import i18n from '@/lib/i18n';

type Namespace = string | readonly string[] | undefined;

function subscribe(onStoreChange: () => void) {
  const rerender = () => onStoreChange();
  i18n.on('languageChanged', rerender);
  i18n.on('loaded', rerender);

  return () => {
    i18n.off('languageChanged', rerender);
    i18n.off('loaded', rerender);
  };
}

function getLanguageSnapshot() {
  return i18n.resolvedLanguage || i18n.language || 'en';
}

export function useTranslation(namespace?: Namespace) {
  useSyncExternalStore(subscribe, getLanguageSnapshot, getLanguageSnapshot);

  return {
    t: i18n.getFixedT(getLanguageSnapshot(), namespace),
    i18n,
    ready: i18n.isInitialized,
  };
}

const reactI18nextShim = {
  useTranslation,
};

export default reactI18nextShim;
