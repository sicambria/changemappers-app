import { getLocale, SupportedLanguage } from './get-locale';

const translationCache: Record<string, Record<string, unknown>> = {};

type TranslationParams = Record<string, string | number | boolean | null | undefined> & {
  returnObjects?: boolean;
};

function interpolate(value: string, params?: TranslationParams): string {
  if (!params) return value;
  return value.replaceAll(/{{\s*([\w.-]+)\s*}}/g, (match, key: string) => {
    const replacement = params[key];
    return replacement === undefined || replacement === null ? match : String(replacement);
  });
}

async function loadTranslation(
  namespace: string,
  lang: SupportedLanguage
): Promise<Record<string, unknown>> {
  const cacheKey = `${lang}:${namespace}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const translation = await import(`@/locales/${lang}/${namespace}.json`);
    translationCache[cacheKey] = translation.default || translation;
    return translationCache[cacheKey];
  } catch {
    const fallback = await import(`@/locales/en/${namespace}.json`);
    translationCache[cacheKey] = fallback.default || fallback;
    return translationCache[cacheKey];
  }
}

export async function getServerTranslation(namespace: string) {
  const lang = await getLocale();
  const translations = await loadTranslation(namespace, lang);

  return {
    t: (key: string, params?: TranslationParams): string => {
      const parts = key.split('.');
      let current: unknown = translations;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }
      if (params?.returnObjects) return current as string;
      return typeof current === 'string' ? interpolate(current, params) : key;
    },
    lang,
  };
}

export async function getMetadataTranslations(namespace: string) {
  const lang = await getLocale();
  const translations = await loadTranslation(namespace, lang);

  return {
    translations: translations,
    lang,
  };
}
