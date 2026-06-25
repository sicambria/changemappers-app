import React from 'react';
import RoadmapPageClient from '@/components/features/roadmap/RoadmapPageClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('roadmap');
  return {
    title: `${t('metaTitle')} | Changemappers`,
    description: t('metaDescription'),
  };
}

export default function RoadmapPage() {
    return <RoadmapPageClient />;
}
