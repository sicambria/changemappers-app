import { notFound, redirect } from 'next/navigation';
import { getPitchAction } from '@/app/actions/pitch';
import { getCurrentUser } from '@/lib/get-current-user';
import PitchForm from '@/components/features/pitch/PitchForm';
import { getServerTranslation } from '@/lib/server-i18n';

interface EditPitchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPitchPage({ params }: Readonly<EditPitchPageProps>) {
  const { id } = await params;
  const { t } = await getServerTranslation('pitch');
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect(`/login?redirect=/pitch/${id}/edit`);
  }

  const result = await getPitchAction(id);
  if (!result.success) {
    notFound();
  }

  const pitch = result.data;
  if (pitch.authorId !== auth.data.id) {
    redirect(`/pitch/${id}`);
  }

  const pitchForForm = {
    id: pitch.id,
    name: pitch.name,
    summary: pitch.summary,
    location: pitch.location,
    website: pitch.website,
    language: pitch.language,
    localContext: pitch.localContext,
    systemicChallenge: pitch.systemicChallenge,
    vision: pitch.vision,
    expectedOutcomes: pitch.expectedOutcomes,
    teamDescription: pitch.teamDescription,
    experience: pitch.experience,
    evidenceLinks: pitch.evidenceLinks,
    stage: pitch.stage as 'IDEA' | 'RESEARCH' | 'PROTOTYPE' | 'PILOT' | 'OPERATING' | 'SCALING',
    mainObstacles: pitch.mainObstacles,
    needsSkills: pitch.needsSkills,
    needsFunding: pitch.needsFunding,
    fundingAmount: pitch.fundingAmount,
    fundingCurrency: pitch.fundingCurrency,
    needsPartners: pitch.needsPartners,
    needsVolunteers: pitch.needsVolunteers,
    needsKnowledge: pitch.needsKnowledge,
    needsOther: pitch.needsOther,
    callToAction: pitch.callToAction,
    contactEmail: pitch.contactEmail,
    usePlatformMessaging: pitch.usePlatformMessaging,
    topicTags: pitch.topicTags,
    communityId: pitch.communityId,
    initiativeId: pitch.initiativeId,
    rdgTags: pitch.rdgTags,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('form.editTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {pitch.name}
        </p>

        <PitchForm pitch={pitchForForm} isEdit />
      </div>
    </main>
  );
}
