import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { LearningProgram } from '@/types/learning';
import LearningHubClient from '@/components/features/learn/LearningHubClient';
import { getLocale } from '@/lib/get-locale';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('learning');
  return {
    title: `${t('metaTitle')} | Changemappers`,
    description: t('metaDescription'),
  };
}

// Cached for 1 hour — static data
export const revalidate = 3600;

export default async function LearnPage() {
    const lang = await getLocale();
    const filePath = path.join(process.cwd(), 'docs', 'data', lang, 'learning-programs.json');
    let raw;
    try {
        raw = await fs.readFile(filePath, 'utf-8');
    } catch (e) {
        console.error(`Failed to load learning programs for ${lang}:`, e);
        if (lang === 'en') {
            throw e;
        } else {
            const fallbackPath = path.join(process.cwd(), 'docs', 'data', 'en', 'learning-programs.json');
            raw = await fs.readFile(fallbackPath, 'utf-8');
        }
    }
    const programs: LearningProgram[] = JSON.parse(raw);

    return (
        <main>
            <LearningHubClient programs={programs} />
        </main>
    );
}
