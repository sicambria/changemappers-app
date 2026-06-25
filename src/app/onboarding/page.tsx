import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUserData } from '@/lib/get-current-user';
import { OnboardingJourneyClient } from './OnboardingJourneyClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const auth = await getCurrentUserData();
  if (!auth.success) {
    redirect('/login?redirect=/onboarding');
  }

  const completedSteps = await prisma.userOnboardingJourneyStep.findMany({
    where: { userId: auth.data.user.id },
    select: { stepId: true },
    orderBy: { completedAt: 'asc' },
  });

  return (
    <OnboardingJourneyClient
      userName={auth.data.user.displayName ?? auth.data.user.name}
      initialCompletedStepIds={completedSteps.map((step) => step.stepId)}
    />
  );
}
