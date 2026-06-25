import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getCurrentUserData } from '@/lib/get-current-user';
import { verifyFullRegCookie } from '@/lib/lean-reg-token';

export type FullRegistrationResumeState = {
  userId: string | null;
  email: string;
  inviteCode: string;
  initialStep: number;
  cmapLevel: number;
  account: {
    name: string;
    displayName: string;
    primaryLanguage: string;
    spokenLanguages: string[];
  } | null;
};

const fullOnboardingSelect = {
  lastStageCompleted: true,
  stage1CompletedAt: true,
  stage2CompletedAt: true,
  stage2_5CompletedAt: true,
  stage3CompletedAt: true,
  stage4CompletedAt: true,
  stage4_5CompletedAt: true,
  stage5CompletedAt: true,
  stage6CompletedAt: true,
  orientationSeenAt: true,
} as const;

function stepFromState(onboardingState: null | {
  stage1CompletedAt: Date | null;
  stage2CompletedAt: Date | null;
  stage2_5CompletedAt: Date | null;
  stage3CompletedAt: Date | null;
  stage4CompletedAt: Date | null;
  stage4_5CompletedAt: Date | null;
  stage5CompletedAt: Date | null;
  stage6CompletedAt: Date | null;
  orientationSeenAt: Date | null;
}) {
  if (!onboardingState?.stage1CompletedAt) return 2;
  if (!onboardingState.stage2CompletedAt) return 3;
  if (!onboardingState.stage2_5CompletedAt) return 4;
  if (!onboardingState.stage3CompletedAt) return 5;
  if (!onboardingState.stage4CompletedAt) return 6;
  if (!onboardingState.stage4_5CompletedAt) return 7;
  if (!onboardingState.stage5CompletedAt) return 8;
  if (!onboardingState.stage6CompletedAt) return 9;
  if (!onboardingState.orientationSeenAt) return 10;
  return 10;
}

async function loadResumeUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      passwordHash: true,
      isEmailVerified: true,
      isRegistrationPending: true,
      usedInviteCode: true,
      primaryLanguage: true,
      spokenLanguages: true,
      onboardingState: { select: fullOnboardingSelect },
      functionalProfile: { select: { cmapLevel: true } },
    },
  });

  if (!user?.isEmailVerified) return null;

  const initialStep = user.passwordHash ? stepFromState(user.onboardingState) : 2;
  return {
    userId: user.id,
    email: user.email,
    inviteCode: user.usedInviteCode ?? '',
    initialStep,
    cmapLevel: user.functionalProfile?.cmapLevel ?? 0,
    account: {
      name: user.passwordHash ? user.name : '',
      displayName: user.displayName ?? '',
      primaryLanguage: user.primaryLanguage ?? 'en',
      spokenLanguages: user.spokenLanguages.length > 0 ? user.spokenLanguages : ['en'],
    },
  } satisfies FullRegistrationResumeState;
}

export async function getFullRegistrationResumeState(): Promise<FullRegistrationResumeState | null> {
  const current = await getCurrentUserData();
  if (current.success && current.data.user.id) {
    const fromAuth = await loadResumeUser(current.data.user.id);
    if (fromAuth && fromAuth.initialStep < 10) return fromAuth;
  }

  const cookieStore = await cookies();
  const signedCookie = cookieStore.get('full_reg_uid')?.value;
  if (!signedCookie) return null;

  const userId = verifyFullRegCookie(signedCookie);
  if (!userId) return null;

  return loadResumeUser(userId);
}
