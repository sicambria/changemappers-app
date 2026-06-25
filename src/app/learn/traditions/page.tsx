import fs from 'node:fs';
import path from 'node:path';
import TraditionsClient from '@/components/features/learn/TraditionsClient';
import { getLocale } from '@/lib/get-locale';
import { Tradition } from '@/types/learning';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('learning');
  return {
    title: `${t('traditions.metaTitle')} | Changemappers`,
    description: t('traditions.metaDescription'),
  };
}

export default async function TraditionsPage() {
    const lang = await getLocale();
    const filePath = path.join(process.cwd(), 'docs', 'data', lang, 'traditions.json');

    let traditions: Tradition[] = [];
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        traditions = JSON.parse(raw);
    } catch (e) {
        console.error(`Failed to load traditions for ${lang}:`, e);
        if (lang !== 'en') {
            try {
                const fallbackPath = path.join(process.cwd(), 'docs', 'data', 'en', 'traditions.json');
                const raw = fs.readFileSync(fallbackPath, 'utf-8');
                traditions = JSON.parse(raw);
            } catch (fallbackErr) {
                console.error("Failed to load fallback traditions:", fallbackErr);
            }
        }
    }

    return <TraditionsClient traditions={traditions} />;
}
