import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { canAccess, type ProfileType } from '@/lib/featureAccess';
import { prisma } from '@/lib/prisma';
import { CompassEntryClient } from '@/components/features/compass/CompassEntryClient';
import { CompassShell } from '@/components/features/compass/CompassShell';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: t('compass.metaTitle'),
    description: t('compass.metaDescription'),
  };
}

export default async function CompassPage() {
  const { t } = await getServerTranslation('common');
  const authResult = await getCurrentUser();
  const user = authResult?.data;

  if (!user) {
    redirect('/login?redirect=/compass');
  }

  if (!canAccess((user.profileType as ProfileType) || 'GUEST', 'compass')) {
    redirect('/dashboard');
  }

  const compassProfile = await prisma.compassProfile.findUnique({
    where: { userId: user.id },
    select: {
      userId: true,
      northStar: true,
      nonNegotiables: true,
      originQuestion: true,
      biographyEntries: true,
      ecosystemMap: true,
      translationMap: true,
      conflictStyleNote: true,
      communicationNote: true,
      timeScore: true,
      resourceScore: true,
      bandwidthScore: true,
      confirmedScope: true,
      energyPatterns: true,
      riskFears: true,
      emotionalPattern: true,
      supportNetwork: true,
      experiments: true,
      domainBalance: true,
      storyWhy: true,
      storyVision: true,
      storyShift: true,
      unlockedPillars: true,
      lastActiveSection: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!compassProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              {t('compass.title')}
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              {t('compass.description')}
            </p>
          </div>
          <CompassEntryClient />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CompassShell compassProfile={compassProfile} />
    </div>
  );
}
