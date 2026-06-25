'use server';

import crypto from 'node:crypto';
import { z } from 'zod';
import { cookies, headers } from 'next/headers';
import prisma, { InviteStatus, PendingRegistrationMode, ProfileType } from '@/lib/prisma';
import { hashPassword, hashRefreshToken } from '@/lib/auth';
import { issueSession } from '@/lib/issue-session';
import { parseInviteCodeProfileType } from '@/lib/featureAccess';
import { rateLimitAsync } from '@/lib/rate-limit';
import { signFullRegCookie, verifyFullRegCookie } from '@/lib/lean-reg-token';
import { sendLeanVerificationEmail } from '@/lib/email';
import { getClientIp } from '@/lib/request-ip';
import { PENDING_REGISTRATION_NAME } from '@/lib/pending-registration-maintenance';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';
import { markUserActivity } from '@/lib/user-activity';
import { isValidDidKey } from '@/lib/did';
import { DAY_MS } from '@/lib/constants';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { getLocale } from '@/lib/get-locale';
import { appendLanguageParam, authMessage, authT } from '@/lib/auth-localization';

const FULL_REG_COOKIE = 'full_reg_uid';
const VERIFICATION_TOKEN_TTL_MS = DAY_MS;
const CONTINUATION_TTL_SECONDS = 60 * 60;

const initiateFullSchema = z.object({
  email: z.email('server.errors.invalidEmail'),
  inviteCode: z.string().optional(),
  termsAccepted: z.literal(true, { error: 'server.errors.termsRequired' }),
  confirmedAge16Plus: z.literal(true, { error: 'server.errors.ageRequired' }),
});

const passwordSchema = z
  .string()
  .min(12, 'server.errors.passwordMin')
  .regex(/[A-Z]/, 'server.errors.passwordUppercase')
  .regex(/[a-z]/, 'server.errors.passwordLowercase')
  .regex(/\d/, 'server.errors.passwordNumber')
  .regex(/[^A-Za-z0-9]/, 'server.errors.passwordSpecial');

const completeFullAccountSchema = z
  .object({
    name: z.string().min(2, 'server.errors.nameMin').max(100),
    displayName: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    invitationCode: z.string().optional(),
    primaryLanguage: z.string().min(2, 'server.errors.chooseLanguage'),
    spokenLanguages: z.array(z.string()).min(1, 'server.errors.chooseSpokenLanguage'),
    didPublicKey: z.string().refine(isValidDidKey, 'server.errors.didInvalid').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, { // SAFE: password confirmation compares two user-entered plaintext fields before hashing.
    message: 'server.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

type InvitePreflight = {
  inviteCode: string;
  invitedByUserId?: string;
  assignedProfileType?: ProfileType;
  hasValidInvite: boolean;
};

function isOpenInviteStatus(status: InviteStatus) {
  return status === InviteStatus.CREATED || status === InviteStatus.SENT || status === InviteStatus.OPENED;
}

function setFullContinuationCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, userId: string) {
  cookieStore.set(FULL_REG_COOKIE, signFullRegCookie(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CONTINUATION_TTL_SECONDS,
    path: '/',
  });
}

async function validateInvitePreflight(inviteCode: string | undefined, normalizedEmail: string, lang: string): Promise<InvitePreflight> {
  const code = inviteCode?.trim() ?? '';
  if (!code) {
    return { inviteCode: '', hasValidInvite: false };
  }

  const invite = await prisma.invite.findUnique({
    where: { code },
    select: {
      id: true,
      createdById: true,
      isDirect: true,
      recipientEmail: true,
      profileType: true,
      status: true,
      expiresAt: true,
    },
  });

  if (invite) {
    const recipientEmail = invite.recipientEmail?.trim().toLowerCase() ?? null;
    if (!isOpenInviteStatus(invite.status) || invite.expiresAt <= new Date()) {
      throw new Error(authT(lang, 'server.errors.inviteInvalidUsed'));
    }
    if (recipientEmail && recipientEmail !== normalizedEmail) {
      throw new Error(authT(lang, 'server.errors.inviteWrongEmail'));
    }

    return {
      inviteCode: code,
      invitedByUserId: invite.createdById,
      assignedProfileType: invite.profileType ?? undefined,
      hasValidInvite: true,
    };
  }

  const inviter = await prisma.user.findUnique({
    where: { invitationCode: code },
    select: { id: true },
  });

  if (!inviter) {
    throw new Error(authT(lang, 'server.errors.inviteInvalid'));
  }

  return {
    inviteCode: code,
    invitedByUserId: inviter.id,
    hasValidInvite: true,
  };
}

async function claimInviteAtCompletion(inviteCode: string, normalizedEmail: string, lang: string) {
  if (!inviteCode) {
    return { hasValidInvite: false, invitedByUserId: undefined, assignedProfileType: undefined, inviteRecordId: undefined };
  }

  const claimed = await prisma.invite.updateMany({
    where: {
      code: inviteCode,
      OR: [{ recipientEmail: null }, { recipientEmail: normalizedEmail }],
      status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
      expiresAt: { gt: new Date() },
    },
    data: { status: InviteStatus.ACCEPTED, acceptedAt: new Date(), lastActivityAt: new Date() },
  });

  if (claimed.count > 0) {
    const invite = await prisma.invite.findUnique({
      where: { code: inviteCode },
      select: { id: true, createdById: true, profileType: true },
    });
    return {
      hasValidInvite: true,
      invitedByUserId: invite?.createdById,
      assignedProfileType: invite?.profileType ?? undefined,
      inviteRecordId: invite?.id,
    };
  }

  const inviter = await prisma.user.findUnique({
    where: { invitationCode: inviteCode },
    select: { id: true },
  });

  if (!inviter) {
    throw new Error(authT(lang, 'server.errors.inviteNoLongerValid'));
  }

  return {
    hasValidInvite: true,
    invitedByUserId: inviter.id,
    assignedProfileType: undefined,
    inviteRecordId: undefined,
  };
}

export async function initiateFullRegistrationAction(
  email: string,
  inviteCode: string,
  termsAccepted: boolean = false,
  confirmedAge16Plus: boolean = false,
): Promise<
  | { success: true; email: string; accountReady?: boolean; verificationRequired?: boolean }
  | { success: false; error: string }
> {
  const lang = await getLocale();
  try {
    const headerList = await headers();
    const ip = getClientIp(headerList);
    const rl = await rateLimitAsync(`full_init_${ip}`, 3, 3_600_000);
    if (!rl.success) {
      return { success: false, error: authT(lang, 'server.errors.tooManyOneHour') };
    }

    const validated = initiateFullSchema.parse({ email, inviteCode, termsAccepted, confirmedAge16Plus });
    const normalizedEmail = validated.email.trim().toLowerCase();
    const invite = await validateInvitePreflight(validated.inviteCode, normalizedEmail, lang);

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isRegistrationPending: true,
        isEmailVerified: true,
        createdAt: true,
        uiLanguage: true,
        pendingRegistrationMode: true,
      },
    });

    if (existing) {
      if (!isPendingRegistrationAccount(existing) || existing.passwordHash) {
        return { success: false, error: authT(lang, 'server.errors.emailAlreadyRegistered') };
      }

      if (existing.isEmailVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            isEmailVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
            invitedById: invite.invitedByUserId,
            usedInviteCode: invite.inviteCode || null,
            profileType: (invite.assignedProfileType ?? parseInviteCodeProfileType(invite.inviteCode || '')) as ProfileType,
            isSuspended: !invite.hasValidInvite,
            pendingRegistrationMode: PendingRegistrationMode.FULL,
          },
          select: { id: true },
        });
        const cookieStore = await cookies();
        setFullContinuationCookie(cookieStore, existing.id);
        return { success: true, email: normalizedEmail, accountReady: true };
      }

      const token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          verificationToken: hashRefreshToken(token),
          verificationTokenExpiry: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
          invitedById: invite.invitedByUserId,
          usedInviteCode: invite.inviteCode || null,
          profileType: (invite.assignedProfileType ?? parseInviteCodeProfileType(invite.inviteCode || '')) as ProfileType,
          isSuspended: !invite.hasValidInvite,
          pendingRegistrationMode: PendingRegistrationMode.FULL,
        },
        select: { id: true },
      });
      await sendLeanVerificationEmail(normalizedEmail, appendLanguageParam(buildAbsoluteUrl(`/api/register/full/verify?token=${token}`), lang), lang);
      return { success: true, email: normalizedEmail, verificationRequired: true };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = hashRefreshToken(verificationToken);
    const profileType = invite.assignedProfileType ?? parseInviteCodeProfileType(invite.inviteCode || '');
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: PENDING_REGISTRATION_NAME,
        isRegistrationPending: true,
        isEmailVerified: false,
        pendingRegistrationMode: PendingRegistrationMode.FULL,
        verificationToken: verificationTokenHash,
        verificationTokenExpiry: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        profileType: profileType as ProfileType,
        primaryLanguage: lang,
        spokenLanguages: [],
        uiLanguage: lang,
        termsAcceptedAt: new Date(),
        termsVersion: LEGAL_VERSIONS.terms,
        privacyVersion: LEGAL_VERSIONS.privacy,
        confirmedAge16Plus: true,
        confirmedAge16PlusAt: new Date(),
        profileCompleteness: 0,
        invitedById: invite.invitedByUserId,
        usedInviteCode: invite.inviteCode || null,
        isSuspended: !invite.hasValidInvite,
      },
      select: { id: true, email: true },
    });

    await prisma.$transaction([
      prisma.userOnboardingState.create({ data: { userId: newUser.id, lastStageCompleted: 0 } }),
      prisma.userFunctionalProfile.create({ data: { userId: newUser.id, energisingFunctions: [], drainingFunctions: [] } }),
    ]);

    await sendLeanVerificationEmail(normalizedEmail, appendLanguageParam(buildAbsoluteUrl(`/api/register/full/verify?token=${verificationToken}`), lang), lang);
    return { success: true, email: normalizedEmail, verificationRequired: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: authMessage(lang, error.issues[0]?.message, 'server.errors.invalidData') };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: authT(lang, 'server.errors.genericTryAgain') };
  }
}

export async function completeFullRegistrationAccountAction(data: {
  name: string;
  displayName?: string;
  password: string;
  confirmPassword: string;
  invitationCode?: string;
  primaryLanguage: string;
  spokenLanguages: string[];
  didPublicKey?: string;
}): Promise<{ success: true; userId: string; pendingApproval?: boolean } | { success: false; error: string }> {
  const lang = await getLocale();
  try {
    const cookieStore = await cookies();
    const signedCookie = cookieStore.get(FULL_REG_COOKIE)?.value;
    if (!signedCookie) {
      return { success: false, error: authT(lang, 'server.errors.sessionExpiredContinue') };
    }

    const userId = verifyFullRegCookie(signedCookie);
    if (!userId) {
      return { success: false, error: authT(lang, 'server.errors.invalidSessionRestart') };
    }

    const validated = completeFullAccountSchema.parse(data);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        passwordHash: true,
        profileType: true,
        isSuspended: true,
        usedInviteCode: true,
      },
    });

    if (!user) return { success: false, error: authT(lang, 'server.errors.userNotFound') };
    if (!user.isEmailVerified) return { success: false, error: authT(lang, 'server.errors.emailNotVerified') };
    if (user.passwordHash) return { success: false, error: authT(lang, 'server.errors.accountAlreadySetup') };

    const normalizedEmail = user.email.trim().toLowerCase();
    const requestedInviteCode = validated.invitationCode?.trim() ?? '';
    const inviteCode = requestedInviteCode || user.usedInviteCode || '';
    const claimedInvite = await claimInviteAtCompletion(inviteCode, normalizedEmail, lang);
    const passwordHash = await hashPassword(validated.password);
    const hasValidInvite = claimedInvite.hasValidInvite;

    // Account finalize + onboarding-state + invite-claim writes must be atomic
    // (AUDIT-20260613-030). claimInviteAtCompletion/hashPassword ran before this group.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: validated.name,
          displayName: validated.displayName || null,
          passwordHash,
          isRegistrationPending: false,
          pendingRegistrationMode: null,
          primaryLanguage: validated.primaryLanguage,
          spokenLanguages: validated.spokenLanguages,
          uiLanguage: validated.primaryLanguage,
          didPublicKey: validated.didPublicKey,
          profileCompleteness: 10,
          verificationToken: null,
          verificationTokenExpiry: null,
          invitedById: claimedInvite.invitedByUserId,
          usedInviteCode: inviteCode || null,
          profileType: (claimedInvite.assignedProfileType ?? user.profileType ?? parseInviteCodeProfileType(inviteCode || '')),
          isSuspended: !hasValidInvite,
        },
        select: { id: true },
      });

      await tx.userOnboardingState.upsert({
        where: { userId },
        create: { userId, lastStageCompleted: 1, stage1CompletedAt: new Date() },
        update: { lastStageCompleted: 1, stage1CompletedAt: new Date() },
      });

      if (claimedInvite.inviteRecordId) {
        await tx.invite.update({
          where: { id: claimedInvite.inviteRecordId },
          data: { recipientId: userId, lastActivityAt: new Date() },
        });
      }
    });

    if (!hasValidInvite) {
      cookieStore.delete(FULL_REG_COOKIE);
      return { success: true, userId, pendingApproval: true };
    }

    // Newly created accounts cannot have 2FA enabled; route through the single
    // session chokepoint so full-session issuance always flows through one place.
    await issueSession({
      id: userId,
      email: user.email,
      profileType: (claimedInvite.assignedProfileType ?? user.profileType),
      isTotpEnabled: false,
    });
        await markUserActivity(userId, { login: true });
    cookieStore.delete(FULL_REG_COOKIE);
    return { success: true, userId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: authMessage(lang, error.issues[0]?.message, 'server.errors.invalidData') };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: authT(lang, 'server.errors.genericTryAgain') };
  }
}
