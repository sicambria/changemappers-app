'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { isOnboardingJourneyStepId } from '@/lib/onboarding-journey';

export async function setOnboardingJourneyStepDoneAction(
  stepId: string,
  done: boolean,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!isOnboardingJourneyStepId(stepId)) {
    return { success: false, error: 'Unknown onboarding step' };
  }

  try {
    if (done) {
      await prisma.userOnboardingJourneyStep.upsert({
        where: {
          userId_stepId: {
            userId: auth.data.user.id,
            stepId,
          },
        },
        create: {
          userId: auth.data.user.id,
          stepId,
        },
        update: {
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.userOnboardingJourneyStep.deleteMany({
        where: { userId: auth.data.user.id, stepId },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/onboarding');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update onboarding step' };
  }
}
