import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getWeakSignalPatternById } from '@/app/actions/weak-signal-pattern';
import { getCurrentUser } from '@/app/actions/auth';
import { PatternForm } from '../../create/PatternForm';
import { getServerTranslation } from '@/lib/server-i18n';
import type { PatternTrajectory } from '@/types/weak-signal';

interface EditPatternPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('signals');
  return {
    title: t('pattern.createMetaTitle'),
  };
}

export default async function EditPatternPage({ params }: Readonly<EditPatternPageProps>) {
  const { id } = await params;
  const auth = await getCurrentUser();

  if (!auth.success || !auth.data) {
    redirect(`/login?redirect=/signals/patterns/${id}/edit`);
  }

  const result = await getWeakSignalPatternById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const pattern = result.data as {
    id: string;
    name: string;
    description: string;
    trajectory: PatternTrajectory;
    hypothesis?: string | null;
    relatedRdgs: string[];
    proposedById: string;
  };

  if (pattern.proposedById !== auth.data.user.id) {
    redirect(`/signals/patterns/${id}`);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PatternForm
        patternId={id}
        initialData={{
          name: pattern.name,
          description: pattern.description,
          trajectory: pattern.trajectory,
          hypothesis: pattern.hypothesis ?? undefined,
          relatedRdgs: pattern.relatedRdgs ?? [],
        }}
      />
    </div>
  );
}
