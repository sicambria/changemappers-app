import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import Link from 'next/link';
import ReflectHubClient from '@/components/features/reflect/ReflectHubClient';
import { getServerTranslation } from '@/lib/server-i18n';
import { getTopReflectionPrompt } from '@/lib/reflection-cadence';

export const dynamic = 'force-dynamic';

async function getReflectData(userId: string) {
  const [functionalSettled, pulseSettled, availabilitySettled, projectSettled] = await Promise.allSettled([
    prisma.userFunctionalProfile.findUnique({
      where: { userId },
      select: {
        availabilityMode: true,
        currentOffer: true,
        energisingFunctions: true,
        functionsUpdatedAt: true,
      },
    }),
    prisma.reflectionRecord.findFirst({
      where: { userId, level: 'L1_PULSE' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.reflectionRecord.findFirst({
      where: { userId, level: 'L2_AVAILABILITY' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.reflectionRecord.findFirst({
      where: { userId, level: 'L3_PROJECT' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);
  const functional = functionalSettled.status === 'fulfilled' ? functionalSettled.value : null;
  const pulse = pulseSettled.status === 'fulfilled' ? pulseSettled.value : null;
  const availability = availabilitySettled.status === 'fulfilled' ? availabilitySettled.value : null;
  const project = projectSettled.status === 'fulfilled' ? projectSettled.value : null;

  return {
    functional,
    lastPulse: pulse?.createdAt,
    lastAvailability: availability?.createdAt,
    lastProject: project?.createdAt,
  };
}

interface ReflectPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ReflectPage({ searchParams }: Readonly<ReflectPageProps>) {
  const { tab } = await searchParams;
  const { t } = await getServerTranslation('common');
  const activeTab = tab === 'deep' ? 'deep' : 'checkin';

  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-gray-500">
          <Link href="/login" className="text-emerald-600 hover:underline">{t('reflectPage.loginLink')}</Link>{' '}
          {t('reflectPage.loginSuffix')}
        </p>
      </div>
    );
  }

  const userId = userRes.data.user.id;
  const data = await getReflectData(userId);
  const renderedAt = new Date().toISOString();
  const renderedAtDate = new Date(renderedAt);

  const nextPrompt = getTopReflectionPrompt(
    {
      L1_PULSE: data.lastPulse ?? null,
      L2_AVAILABILITY: data.lastAvailability ?? null,
      L3_PROJECT: data.lastProject ?? null,
    },
    renderedAtDate,
  );

  return <ReflectHubClient data={data} activeTab={activeTab} renderedAt={renderedAt} nextPrompt={nextPrompt} />;
}
