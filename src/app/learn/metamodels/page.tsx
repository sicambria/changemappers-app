import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Metamodel } from '@/components/features/learn/MetamodelsClient';
import MetamodelsClient from '@/components/features/learn/MetamodelsClient';
import { getLocale } from '@/lib/get-locale';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('learning');
  return {
    title: `${t('metamodels.metaTitle')} | Changemappers`,
    description: t('metamodels.metaDescription'),
  };
}

export const revalidate = 3600;

export default async function MetamodelsPage() {
    const lang = await getLocale();
    const filePath = path.join(process.cwd(), 'docs', 'data', lang, 'metamodels.json');
    let raw;
    try {
        raw = await fs.readFile(filePath, 'utf-8');
    } catch (e) {
        console.error(`Failed to load metamodels for ${lang}:`, e);
        if (lang === 'en') {
            throw e;
        } else {
            const fallbackPath = path.join(process.cwd(), 'docs', 'data', 'en', 'metamodels.json');
            raw = await fs.readFile(fallbackPath, 'utf-8');
        }
    }
    const models: Metamodel[] = JSON.parse(raw);

    return (
        <main>
            <MetamodelsClient models={models} />
        </main>
    );
}
