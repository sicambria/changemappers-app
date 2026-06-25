import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUserData } from '@/lib/get-current-user';
import { getMatchmakingRecommendations } from '@/app/actions/matchmaking';
import { MatchmakingClient } from './MatchmakingClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: `${t('matchmaking.title')} | Changemappers`,
    description: t('matchmaking.description'),
  };
}

export default async function MatchmakingPage() {
  const auth = await getCurrentUserData();
  if (!auth.success || !auth.data?.user) {
    redirect('/login?redirect=/matchmaking');
  }

  const onboardingState = await prisma.userOnboardingState.findUnique({
    where: { userId: auth.data.user.id },
    select: { lastStageCompleted: true },
  });

  if ((onboardingState?.lastStageCompleted ?? 0) < 6) {
    redirect('/onboarding');
  }

  const response = await getMatchmakingRecommendations();

  if (!response.success) {
    return <MatchmakingClient users={{}} communities={[]} causes={[]} error={response.error} />;
  }

  const { users, communities, causes } = response.data || { users: {}, communities: [], causes: [] };
  const usersMap = (users || {});

  return <MatchmakingClient users={usersMap} communities={communities} causes={causes} />;
}
