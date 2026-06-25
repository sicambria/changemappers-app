import fs from 'node:fs';
import path from 'node:path';
import ChangePatternsClient from './ChangePatternsClient';
import { ChangePattern } from './types';
import { getLocale } from '@/lib/get-locale';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('learning');
  return {
    title: `${t('patterns.metaTitle')} | Changemappers`,
    description: t('patterns.metaDescription'),
  };
}

export default async function ChangePatternsPage() {
const lang = await getLocale();
const jsonPath = path.join(process.cwd(), 'docs', 'data', lang, 'grassroots-change-patterns.json');
let patterns: ChangePattern[];
try {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  patterns = JSON.parse(raw);
} catch (e) {
  console.error(`Failed to load patterns for ${lang}:`, e);
  if (lang === 'en') {
    return <ChangePatternsClient initialPatterns={[]} error={true} />;
  } else {
    try {
      const fallbackPath = path.join(process.cwd(), 'docs', 'data', 'en', 'grassroots-change-patterns.json');
      const raw = fs.readFileSync(fallbackPath, 'utf8');
      patterns = JSON.parse(raw);
    } catch (fallbackErr) {
      console.error("Failed to load fallback patterns:", fallbackErr);
      return <ChangePatternsClient initialPatterns={[]} error={true} />;
    }
  }
}

return <ChangePatternsClient initialPatterns={patterns} />;
}
