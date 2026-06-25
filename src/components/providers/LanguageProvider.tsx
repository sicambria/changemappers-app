'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import i18n, { ensureI18nLanguage, resolveSupportedLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';
import { updateUiLanguageAction } from '@/app/actions';

const LS_KEY = 'cm_ui_language';
const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

interface LanguageContextValue {
    language: SupportedLanguage;
    changeLanguage: (lang: SupportedLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  changeLanguage: async () => {},
});

export function useLanguage() {
    return useContext(LanguageContext);
}

interface LanguageProviderProps {
    children: ReactNode;
    /** uiLanguage from the authenticated user (passed from server/auth context) */
    initialLanguage?: string | null;
}

function isSupportedLanguage(raw: string | null | undefined): raw is SupportedLanguage {
  return !!raw && (SUPPORTED_LANGUAGES as readonly string[]).includes(raw);
}

function persistLanguageCookie(lang: SupportedLanguage) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LS_KEY}=${encodeURIComponent(lang)}; Max-Age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

export function LanguageProvider({ children, initialLanguage }: Readonly<LanguageProviderProps>) {
    const [language, setLanguage] = useState<SupportedLanguage>(() => {
        const lang = resolveSupportedLanguage(initialLanguage);
        // Sync i18n silently on the client before the first render to prevent
        // a hydration mismatch when the singleton initialized to a different language.
        if (globalThis.window !== undefined) {
            ensureI18nLanguage(lang, true);
        }
        return lang;
    });

    // On mount: prefer a supported localStorage override, then the server locale.
    useEffect(() => {
        let lang = resolveSupportedLanguage(initialLanguage);
        try {
            const stored = localStorage.getItem(LS_KEY);
            if (isSupportedLanguage(stored)) {
                lang = stored;
            }
        } catch {
            // Keep the server-provided locale when storage is unavailable.
        }
        setLanguage(lang);
        persistLanguageCookie(lang);
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When initialLanguage changes (for example after login), authenticated
    // server preference wins and becomes the browser's next default.
    useEffect(() => {
        if (!initialLanguage) return;
        const lang = resolveSupportedLanguage(initialLanguage);
        setLanguage(lang);
        i18n.changeLanguage(lang);
        persistLanguageCookie(lang);
        try {
            localStorage.setItem(LS_KEY, lang);
        } catch {
            // Keep the server-provided language when storage is unavailable.
        }
    }, [initialLanguage]);

    const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        persistLanguageCookie(lang);
        try {
            localStorage.setItem(LS_KEY, lang);
        } catch { /* ignore */ }
        // Persist to DB for logged-in users (fire-and-forget, don't block UI)
        updateUiLanguageAction(lang).catch((error: unknown) => {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[LanguageProvider] Failed to persist UI language', error);
            }
        });
    }, []);

    const contextValue = useMemo(
        () => ({ language, changeLanguage }),
        [language, changeLanguage],
    );

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}
