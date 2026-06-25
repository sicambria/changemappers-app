'use client';

// Renders the app shell immediately.
// The react-i18next singleton is initialized in `src/lib/i18n`, so we do not
// need to mount `I18nextProvider` here. Rendering that provider in the current
// Next.js/React server pipeline triggers invalid hook calls during SSR.

import { ReactNode, useEffect } from 'react';
import { ensureI18nLanguage } from '@/lib/i18n';

interface I18nProviderProps {
    children: ReactNode;
    initialLanguage?: string | null;
}

export function I18nProvider({ children, initialLanguage }: Readonly<I18nProviderProps>) {
    // SYNC: Call during render to ensure server-side singleton matches client expectation.
    // Use 'silent=true' to avoid triggering languageChanged events that break hydration.
    if (initialLanguage) {
        ensureI18nLanguage(initialLanguage, true);
    }

    useEffect(() => {
        // Ensure i18next remains in sync if initialLanguage changes later
        if (initialLanguage) {
            ensureI18nLanguage(initialLanguage);
        }
    }, [initialLanguage]);

    return <>{children}</>;
}

