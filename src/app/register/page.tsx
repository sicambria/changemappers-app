/**
 * Server Component — /register
 *
 * Default route: golden-path registration flow (~7-10 min)
 * Full flow:     /register?regmode=full  (original multi-stage wizard)
 *
 * ACTIVE_DEV_RULES §1: No client-side initial fetches.
 */

import { redirect } from 'next/navigation';
import { getCauses } from '@/app/actions/causes';
import { isInviteCodeRequired } from '@/lib/site-config';
import RegisterWizardClient from './RegisterWizardClient';
import LeanRegisterWizard from './LeanRegisterWizard';
import { getCurrentUser } from '@/lib/get-current-user';
import { getLeanRegistrationResumeState } from '@/lib/lean-registration-resume';
import { getFullRegistrationResumeState } from '@/lib/full-registration-resume';
import { getMatchingActivationResumeTarget } from '@/lib/registration-gate';

export const dynamic = 'force-dynamic';

interface Props {
    searchParams?: Promise<{ regmode?: string; step?: string; error?: string; inviteCode?: string; continuation?: string }>;
}

function parseInitialStep(stepParam: string | undefined): number {
    const raw = stepParam ? Number.parseInt(stepParam, 10) : 1;
    return Number.isNaN(raw) || raw < 1 || raw > 6 ? 1 : raw;
}

function extractCauses(causesResult: Awaited<ReturnType<typeof getCauses>>) {
    return causesResult.success && causesResult.data ? causesResult.data : [];
}

export default async function RegisterPage(props: Readonly<Props>) {
    const { searchParams } = props ?? {};
    const params = searchParams ? await searchParams : {};
    const currentUserResult = await getCurrentUser();

    if (currentUserResult.success) {
        // Two-gate model (AUDIT-20260611-001): only fully-activated users are
        // bounced to the dashboard; joined-but-unactivated users may always
        // come back here to continue (or revisit) matching activation.
        const activationTarget = await getMatchingActivationResumeTarget({
            userId: currentUserResult.data.id,
            isAdmin: currentUserResult.data.isAdmin,
        });

        if (activationTarget === null) {
            redirect('/dashboard');
        }
    }

    // Full registration mode: /register?regmode=full
    if (params.regmode === 'full') {
        const causes = extractCauses(await getCauses());
        const resumeState = await getFullRegistrationResumeState();
        return <RegisterWizardClient initialCauses={causes} initialResumeState={resumeState} />;
    }

    // Lean mode (default) — parse initial step from URL (used after email verify redirect)
    const causes = extractCauses(await getCauses());
    const initialStep = parseInitialStep(params.step);
    const errorCode = params.error;
    const requireInviteCode = await isInviteCodeRequired();
    const initialInviteCode = typeof params.inviteCode === 'string' ? params.inviteCode : '';
    const initialUserId = currentUserResult.success && initialStep >= 4 ? currentUserResult.data.id : null;
    const initialResumeState = initialStep === 3 ? await getLeanRegistrationResumeState() : null;
    const continuationReason = initialStep === 3 && params.continuation === 'cookie-missing' ? 'cookie-missing' : undefined;

    return (
        <LeanRegisterWizard
            initialStep={initialStep}
            errorCode={errorCode}
            requireInviteCode={requireInviteCode}
            initialInviteCode={initialInviteCode}
            initialCauses={causes}
            initialUserId={initialUserId}
            initialResumeState={initialResumeState}
            continuationReason={continuationReason}
        />
    );
}
