import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getWeakSignalById } from '@/app/actions/weak-signal';
import { getCurrentUser } from '@/app/actions/auth';
import { SignalForm } from '../../create/SignalForm';
import { getServerTranslation } from '@/lib/server-i18n';

interface EditSignalPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('signals');
  return {
    title: t('editMetaTitle'),
  };
}

export default async function EditSignalPage({ params }: Readonly<EditSignalPageProps>) {
  const { id } = await params;

  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect(`/login?redirect=/signals/${id}/edit`);
  }

  const result = await getWeakSignalById(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const signal = result.data;

  if (signal.createdById !== auth.data.user.id) {
    redirect(`/signals/${id}`);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SignalForm
        signalId={id}
        initialData={{
          title: signal.title,
          description: signal.description ?? undefined,
          context: signal.context ?? undefined,
          domain: signal.domain,
          scale: signal.scale,
          confidence: signal.confidence,
          novelty: signal.novelty,
          regenerativeRelevance: signal.regenerativeRelevance,
          sourceType: signal.sourceType,
          sourceUrl: signal.sourceUrl ?? undefined,
          isLocalizable: signal.isLocalizable,
          locationName: signal.locationName ?? undefined,
          latitude: signal.latitude ?? undefined,
          longitude: signal.longitude ?? undefined,
          tags: signal.tags,
          communityId: signal.communityId ?? undefined,
          patternId: signal.patternId ?? undefined,
        }}
      />
    </div>
  );
}
