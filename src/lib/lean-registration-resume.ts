import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyLeanRegCookie } from '@/lib/lean-reg-token';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';

export type LeanRegistrationResumeStatus =
  | 'ready'
  | 'missing-cookie'
  | 'invalid-cookie'
  | 'not-found'
  | 'already-complete'
  | 'email-unverified';

export type LeanRegistrationStep3InitialValues = {
  displayName?: string;
  primaryLanguage: string;
  spokenLanguages: string[];
  country: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
};

export type LeanRegistrationResumeState =
  | {
      status: 'ready';
      userId: string;
      email: string;
      initialValues: LeanRegistrationStep3InitialValues;
    }
  | {
      status: Exclude<LeanRegistrationResumeStatus, 'ready'>;
      email?: string;
    };

export async function getLeanRegistrationResumeState(): Promise<LeanRegistrationResumeState> {
  const cookieStore = await cookies();
  const signedCookie = cookieStore.get('lean_reg_uid')?.value;

  if (!signedCookie) {
    return { status: 'missing-cookie' };
  }

  const userId = verifyLeanRegCookie(signedCookie);
  if (!userId) {
    return { status: 'invalid-cookie' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      isRegistrationPending: true,
      isEmailVerified: true,
      displayName: true,
      primaryLanguage: true,
      spokenLanguages: true,
      country: true,
      city: true,
      latitude: true,
      longitude: true,
      timezone: true,
    },
  });

  if (!user) {
    return { status: 'not-found' };
  }

  if (!isPendingRegistrationAccount(user)) {
    return { status: 'already-complete', email: user.email };
  }

  if (!user.isEmailVerified) {
    return { status: 'email-unverified', email: user.email };
  }

  return {
    status: 'ready',
    userId: user.id,
    email: user.email,
    initialValues: {
      displayName: user.displayName ?? undefined,
      primaryLanguage: user.primaryLanguage || 'hu',
      spokenLanguages: user.spokenLanguages.length > 0 ? user.spokenLanguages : ['hu'],
      country: user.country || 'Hungary',
      city: user.city ?? undefined,
      latitude: user.latitude ?? undefined,
      longitude: user.longitude ?? undefined,
      timezone: user.timezone ?? undefined,
    },
  };
}
