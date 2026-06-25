import fs from 'node:fs';
import path from 'node:path';
import { getLocale } from '@/lib/get-locale';
import RegenerativeSkillsClient from './RegenerativeSkillsClient';
import { FlattenedSkill, SkillQuadrant, SkillHorizon, SkillNode } from './types';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('learning');
  return {
    title: `${t('skills.metaTitle')} | Changemappers`,
    description: t('skills.metaDescription'),
  };
}

export default async function RegenerativeSkillsPage() {
    const lang = await getLocale();
    // 1. Olvassuk be a JSON-t szerveroldalon (Nincs kliens-oldali waterfall)
    const jsonPath = path.join(process.cwd(), 'docs', 'data', lang, 'regenerative-skills.json');
    let dbRaw;
    try {
        dbRaw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
        console.error(`Failed to load skills DB for ${lang}:`, e);
        // Fallback to English if localized file fails
        if (lang === 'en') {
            return <RegenerativeSkillsClient initialSkills={[]} error={true} />;
        } else {
            try {
                const fallbackPath = path.join(process.cwd(), 'docs', 'data', 'en', 'regenerative-skills.json');
                dbRaw = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            } catch (fallbackErr) {
                console.error("Failed to load fallback skills DB:", fallbackErr);
                return <RegenerativeSkillsClient initialSkills={[]} error={true} />;
            }
        }
    }

    // 2. Laposítsuk ki a fát
    const flattenedSkills: FlattenedSkill[] = [];

    const db = dbRaw.skillsDatabase as Record<SkillQuadrant, Record<SkillHorizon, SkillNode[]>>;

    const quadrants = Object.keys(db) as SkillQuadrant[];
    for (const q of quadrants) {
        const horizons = Object.keys(db[q] || {}) as SkillHorizon[];
        for (const h of horizons) {
            const arr = db[q][h] || [];
            for (const skill of arr) {
                flattenedSkills.push({
                    ...skill,
                    quadrant: q,
                    horizon: h
                });
            }
        }
    }

    // Pass the initial flat array to the interactive client component
    return <RegenerativeSkillsClient initialSkills={flattenedSkills} />;
}
