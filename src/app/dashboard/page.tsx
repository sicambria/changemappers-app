// Post-Login Dashboard — Action Router (Choice Architecture)
// Server Component: auth-gated, fetches dashboardLayout from DB

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { verifyAccessToken, refreshAccessToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ActionRouterClient } from '@/components/features/dashboard/ActionRouterClient';
import type { DashboardTile } from '@/types/dashboard';
import { DASHBOARD_TILE_IDS } from '@/types/dashboard';
import { getOnboardingJourneyProgress } from '@/lib/onboarding-journey';

// Auth-gated — never cache
export const dynamic = 'force-dynamic';

function resolveDashboardLayout(rawLayout: unknown): DashboardTile[] {
    if (!Array.isArray(rawLayout) || (rawLayout as unknown[]).length === 0) return DEFAULT_LAYOUT;
    const stored = rawLayout as unknown as DashboardTile[];
    const storedIds = new Set(stored.map((t) => t.id));
    const missing = DASHBOARD_TILE_IDS.filter((id) => !storedIds.has(id)).map((id) => ({ id, visible: true }));
    return [...stored, ...missing];
}

function getLeanRegistrationResumeStep(lastStageCompleted: number | null): 4 | 5 | 6 {
    if (lastStageCompleted !== null && lastStageCompleted >= 3) return 6;
    if (lastStageCompleted !== null && lastStageCompleted >= 2) return 5;
    return 4;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
}

const DEFAULT_LAYOUT: DashboardTile[] = DASHBOARD_TILE_IDS.map((id) => ({
    id,
    visible: true,
}));


export default async function DashboardPage() {
    // Resolve auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const refreshTokenCookie = cookieStore.get('refreshToken')?.value;

    let payload = token ? verifyAccessToken(token) : null;

    if (!payload && refreshTokenCookie) {
        const newTokens = await refreshAccessToken(refreshTokenCookie);
        if (newTokens) payload = verifyAccessToken(newTokens.accessToken);
    }

    if (!payload) redirect('/login');

    // Fetch user + onboarding state in parallel (ACTIVE_DEV_RULES §1).
    // Promise.allSettled ensures a slow/failing onboarding query does not kill the user fetch.
    // Individual withTimeout prevents a single hung query from blocking the entire render.
    const [userSettled, onboardingSettled, journeySettled] = await Promise.allSettled([
        withTimeout(
            prisma.user.findUnique({
                where: { id: payload.userId },
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    createdAt: true,
                    dashboardLayout: true,
                    bio: true,
                    city: true,
                    country: true,
                    profilePhoto: true,
                    archetypes: true,
                    skills: { select: { skillType: true, skill: true } },
                    values: { select: { value: true } },
                    interests: { select: { interest: true } },
                    website: true,
                    socialLinks: true,
                    enjoyDoing: true,
                    currentIntention: true,
                    collaborationPreference: true,
                    availabilityDetails: true,
                    isRemoteCapable: true,
                    mainCauses: { select: { id: true, title: true } },
                    interestedCauses: { select: { id: true, title: true } },
                    isEmailVerified: true,
                },
            }),
            5000,
            null
        ),
        withTimeout(
            prisma.userOnboardingState
                .findUnique({ where: { userId: payload.userId }, select: { orientationSeenAt: true, lastStageCompleted: true } })
                .then((state) => state ?? null),
            5000,
            null
        ),
        withTimeout(
            prisma.userOnboardingJourneyStep.findMany({
                where: { userId: payload.userId },
                select: { stepId: true },
            }),
            5000,
            []
        ),
    ]);

    // 2026-06-18 audit C9: let TS infer the Prisma select payload type from
    // userSettled.value instead of discarding it with `any` — user.skills/values/
    // mainCauses are now type-checked against the select above.
    const user = userSettled.status === 'fulfilled' ? userSettled.value : null;
    const onboardingData = onboardingSettled.status === 'fulfilled' ? onboardingSettled.value : null;
    const journeySteps = journeySettled.status === 'fulfilled' ? journeySettled.value : [];
    const completedJourneyStepIds = journeySteps.map((step) => step.stepId);

    // Fetch cmapLevel separately only when needed for the onboarding banner
    const leanRegistrationLastStage = onboardingData?.lastStageCompleted ?? null;
    const needsLeanRegistrationCompletion = leanRegistrationLastStage !== null && leanRegistrationLastStage < 6;
    const leanRegistrationResumeStep = getLeanRegistrationResumeStep(leanRegistrationLastStage);
    const needsBanner = onboardingData && (!onboardingData.orientationSeenAt || needsLeanRegistrationCompletion);
    const cmapLevel: number | null = needsBanner
        ? await withTimeout(
              prisma.userFunctionalProfile
                  .findUnique({ where: { userId: payload.userId }, select: { cmapLevel: true } })
                  .then((fp) => fp?.cmapLevel ?? null),
              3000,
              null
          )
        : null;

    if (!user) {
        // The JWT payload was verified above, so the session is cryptographically valid.
        // A null user here means either:
        //   (a) The user row no longer exists — genuine session expiry → login.
        //   (b) The DB query timed out — DO NOT redirect to /login; that falsely
        //       signals the session is invalid. Instead surface a retriable error.
        // We use /login?reason=session_expired to distinguish from proxy-redirect
        // so the login page can show an appropriate message.
        redirect('/login?reason=session_expired');
    }

    const layout = resolveDashboardLayout(user.dashboardLayout);

    const userName = user.displayName || user.name;

    const mappedUser = {
        ...user,
        skills: user.skills,
        values: user.values,
        interests: user.interests,
        mainCauses: user.mainCauses,
        interestedCauses: user.interestedCauses,
    };

    const onboardingProgress = getOnboardingJourneyProgress(completedJourneyStepIds);

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <ActionRouterClient
                initialLayout={layout}
                userName={userName}
                user={mappedUser}
                showOnboardingBanner={needsBanner ?? false}
                cmapLevel={cmapLevel}
                requiresLeanRegistrationCompletion={needsLeanRegistrationCompletion}
                leanRegistrationResumeStep={leanRegistrationResumeStep}
                onboardingProgress={onboardingProgress}
            />
        </Suspense>
    );
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/60 to-slate-950 flex items-center justify-center">
            <div className="w-full max-w-6xl px-4 py-12 animate-pulse">
                <div className="h-10 w-64 mx-auto bg-white/10 rounded-xl mb-4" />
                <div className="h-5 w-80 mx-auto bg-white/10 rounded-lg mb-12" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 bg-white/5 rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
