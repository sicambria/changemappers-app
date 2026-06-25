import enAuth from '@/locales/en/auth.json';
import esAuth from '@/locales/es/auth.json';
import huAuth from '@/locales/hu/auth.json';

export type AuthLanguage = 'en' | 'hu' | 'es';

const AUTH_TRANSLATIONS: Record<AuthLanguage, Record<string, unknown>> = {
  en: enAuth,
  hu: huAuth,
  es: esAuth,
};

export const AUTH_LANGUAGES: AuthLanguage[] = ['en', 'hu', 'es'];

export function resolveAuthLanguage(value: string | null | undefined): AuthLanguage {
  return AUTH_LANGUAGES.includes(value as AuthLanguage) ? (value as AuthLanguage) : 'en';
}

export function authT(
  language: string | null | undefined,
  key: string,
  params: Record<string, string | number | undefined> = {},
): string {
  const lang = resolveAuthLanguage(language);
  const fallback = lookup(AUTH_TRANSLATIONS.en, key);
  const value = lookup(AUTH_TRANSLATIONS[lang], key) ?? fallback ?? key;
  if (typeof value !== 'string') return key;
  return value.replaceAll(/{{\s*(\w+)\s*}}/g, (_match, name: string) => String(params[name] ?? ''));
}

export function authMessage(
  language: string | null | undefined,
  keyOrMessage: string | undefined,
  fallbackKey: string,
): string {
  if (!keyOrMessage) return authT(language, fallbackKey);
  if (keyOrMessage.startsWith('server.')) return authT(language, keyOrMessage);
  return keyOrMessage;
}

export function appendLanguageParam(url: string, language: string | null | undefined): string {
  const lang = resolveAuthLanguage(language);
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('lang', lang);
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}lang=${encodeURIComponent(lang)}`;
  }
}

function lookup(source: Record<string, unknown>, key: string): unknown {
  let current: unknown = source;
  for (const part of key.split('.')) {
    if (!current || typeof current !== 'object' || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
