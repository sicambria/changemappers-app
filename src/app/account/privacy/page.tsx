import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import prisma from '@/lib/prisma';
import { getServerTranslation } from '@/lib/server-i18n';
import { PrivacySettingsClient } from './PrivacySettingsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: t('privacy.metadataTitle'),
    description: t('privacy.metadataDescription'),
  };
}

export default async function AccountPrivacyPage() {
  const { t } = await getServerTranslation('common');
  const authResult = await getCurrentUser();
  if (!authResult.success || !authResult.data) redirect('/login?redirect=/account/privacy');

  const userId = authResult.data.id;
  const privacyData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      processingRestricted: true,
      declineAlgorithmicMatching: true,
      allowSensitiveMatching: true,
      specialCategoryConsentAt: true,
      specialCategoryConsentWithdrawnAt: true,
      scheduledDeletionAt: true,
    },
  });
  if (!privacyData) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('privacy.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('privacy.intro')}</p>
        </div>
        <PrivacySettingsClient
          userId={userId}
          processingRestricted={privacyData.processingRestricted}
          declineAlgorithmicMatching={privacyData.declineAlgorithmicMatching}
          allowSensitiveMatching={privacyData.allowSensitiveMatching}
          specialCategoryConsentAt={privacyData.specialCategoryConsentAt?.toISOString() ?? null}
          specialCategoryConsentWithdrawnAt={privacyData.specialCategoryConsentWithdrawnAt?.toISOString() ?? null}
          scheduledDeletionAt={privacyData.scheduledDeletionAt?.toISOString() ?? null}
        />
        <p className="mt-8 text-xs text-gray-500">
          {t('privacy.policyPrefix')}{' '}
          <a href="/privacy" className="underline hover:text-gray-700">{t('privacy.policyLink')}</a>{' '}
          {t('privacy.policySuffix')}{' '}
          <a href="mailto:changemappers@pm.me" className="underline hover:text-gray-700">changemappers@pm.me</a>
          {' '}
          {t('privacy.policyFallback')}
        </p>
      </div>
    </main>
  );
}
