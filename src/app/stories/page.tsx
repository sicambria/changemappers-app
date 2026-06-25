import React from 'react';
import StoriesPageClient from '@/components/features/stories/StoriesPageClient';
import { getStoriesPageData } from '@/app/actions/stories';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('stories');
  return {
    title: `${t('metaTitle')} | Changemappers`,
    description: t('metaDescription'),
  };
}

export default async function StoriesPage() {
  const data = await getStoriesPageData();

  return (
    <StoriesPageClient
      initialStories={data.stories}
      currentUserId={data.currentUserId}
      currentUserName={data.currentUserName}
    />
  );
}
