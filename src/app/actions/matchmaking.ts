'use server';

import { revalidatePath } from 'next/cache';
import { logActionError } from '@/lib/action-logger';
import { isDynamicServerUsageError } from '@/lib/server-action-errors';
import { prisma, ChangemakerLevel } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { calculateCommunityMatchScore } from '@/lib/matching';
import { calculateFreshnessDecay } from '@/app/services/freshness';
import { canViewerOpenProfile, getProfileExposureSettings, canExposeProfileField } from '@/lib/profile-exposure';
import { getMatchableMemberWhereInput, hasAvailableMemberPresence, isMatchableMemberAccount } from '@/lib/public-member-eligibility';
import { isRecentlyActive } from '@/lib/user-activity';

export type MatchItemType = 'USER' | 'COMMUNITY' | 'EVENT' | 'CAUSE';

export interface MatchReasonToken {
    key: string;
    count?: number;
}

export interface MatchResult {
    id: string;
    type: MatchItemType;
    category?: string; // MENTOR_MENTEE, COMPLEMENTARY_SYMMETRIC, etc.
    title: string;
    subtitle?: string;
    score: number;
    matchReasons: string[];
    matchReasonTokens?: MatchReasonToken[];
    imageUrl?: string;
    link?: string;
    canOpenProfile?: boolean;
    isRecentlyActive?: boolean;
}

// Map high-leverage vs high-risk archetypes (GA=Pollinator, LP=Mycelium, RM=Keystone, SD=Alchemist/Sentinel)
const ASYMMETRIC_PAIRS = [
    { a: 'POLLINATOR', b: 'MYCELIUM' },
    { a: 'KEYSTONE', b: 'ALCHEMIST' },
    { a: 'KEYSTONE', b: 'MYCELIUM' },
    { a: 'PRISM', b: 'ALCHEMIST' },
    { a: 'PRISM', b: 'SENTINEL' }
];

function getAsymmetryFlag(archA: string[], archB: string[]): string | undefined {
    for (const a of archA) {
        for (const b of archB) {
            if (ASYMMETRIC_PAIRS.some(p => (p.a === a && p.b === b) || (p.a === b && p.b === a))) {
                return "ASYMMETRIC_HISTORY";
            }
        }
    }
    return undefined;
}

// Map ChangemakerLevel enum to integer
const levelMap: Record<ChangemakerLevel, number> = {
    'LEVEL_0': 0, 'LEVEL_1': 1, 'LEVEL_2': 2, 'LEVEL_3': 3, 'LEVEL_4': 4,
    'LEVEL_5': 5, 'LEVEL_6': 6, 'LEVEL_7': 7, 'LEVEL_8': 8, 'LEVEL_9': 9
};

const DELIVERING_MULTIPLIER = 0.5;
const LANGUAGE_PENALTY = 0.3;
const REJECTION_SUPPRESSION_DAYS = 30;

interface SeekerMatchContext {
    id: string;
    level: number;
    archetypes: string[];
    languages: string[];
    focusMode: string | null | undefined;
    skillsOffered: string[];
    skillsLearning: string[];
    energising: string[];
    needs: string[];
    rdgActive: string[];
    rdgInterested: string[];
    causeIds: string[];
    protectionNeeds: string[];
    city: string | null | undefined;
    country: string | null | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawUser: any;
}

interface ScorePairResult {
    score: number;
    relType: string;
    reasons: string[];
    reasonTokens: MatchReasonToken[];
}

interface CandidateSkills {
    uLevel: number;
    uSkillsOffered: string[];
    uSkillsLearning: string[];
    uEnergising: string[];
    uDraining: string[];
    uArchetypes: string[];
    uSustainabilityObj: Record<string, string>;
}

interface CandidateRdg {
    uRdgActive: string[];
    uRdgInterested: string[];
    uCauseIds: string[];
}

// Candidate shapes derived from the `loadMatchCandidates` query selects, so the scoring
// helpers are typed against exactly what the DB returns (replaces the prior `any`s).
type CandidateUser = Awaited<ReturnType<typeof loadMatchCandidates>>['otherUsers'][number];
type CandidateCommunity = Awaited<ReturnType<typeof loadMatchCandidates>>['communities'][number];
type CandidateCause = Awaited<ReturnType<typeof loadMatchCandidates>>['causes'][number];

function extractCandidateSkills(u: CandidateUser): CandidateSkills {
    const fp = u.functionalProfile;
    const uLevel = levelMap[u.changemakeLevel] || 0;
    const uSkillsOffered = u.skills.filter((s: { skillType: string }) => s.skillType === 'OFFERED').map((s: { skill: string }) => s.skill);
    const uSkillsLearning = u.skills.filter((s: { skillType: string }) => s.skillType === 'SEEKING').map((s: { skill: string }) => s.skill);
    const uEnergising = (fp?.energisingFunctions || []);
    const uDraining = (fp?.drainingFunctions || []);
    const uArchetypes = (u.archetypes || []) as string[];
    const uSustainabilityObj = (fp?.sustainabilityMap || {}) as Record<string, string>;
    return { uLevel, uSkillsOffered, uSkillsLearning, uEnergising, uDraining, uArchetypes, uSustainabilityObj };
}

function extractCandidateRdg(u: CandidateUser): CandidateRdg {
    const fp = u.functionalProfile;
    const uRdgActive = (fp?.rdgMain || u.rdgAreas || []);
    const uRdgInterested = (fp?.rdgInterested || []);
    const uCauseIds = u.mainCauses.map((c: { id: string }) => c.id);
    return { uRdgActive, uRdgInterested, uCauseIds };
}

function computeRelType(
    levelGap: number,
    myNeedUiHave: string[],
    uNeedMiHave: string[],
    sharedOffering: string[],
    sharedLearning: string[],
): string {
    if (levelGap >= 3) return 'MENTOR_MENTEE';
    if (myNeedUiHave.length > 0 && uNeedMiHave.length > 0) return 'COMPLEMENTARY_SYMMETRIC';
    if (myNeedUiHave.length > 0 || uNeedMiHave.length > 0) return 'SUPPORT';
    if (sharedOffering.length > 0) return 'PEER';
    if (sharedLearning.length > 0) return 'FELLOW_TRAVELLER';
    return 'WEAK_TIE';
}

function scoreFunctionalFit(
    seeker: SeekerMatchContext,
    cs: CandidateSkills,
    myNeedUiHave: string[],
    reasonTokens: MatchReasonToken[],
    reasons: string[],
): number {
    let score = 0;
    const depleting = seeker.needs.filter(n => cs.uSustainabilityObj[n] === 'depleting');
    if (depleting.length > 0) score -= depleting.length * 6;
    const protective = seeker.protectionNeeds.filter(pn => cs.uSkillsOffered.includes(pn) || cs.uEnergising.includes(pn));
    if (protective.length > 0) {
        score += protective.length * 4;
        reasonTokens.push({ key: 'protectiveSupport', count: protective.length });
        reasons.push(`Protective support (${protective.length})`);
    }
    if (myNeedUiHave.length > 0) {
        score += myNeedUiHave.length * 3;
        reasonTokens.push({ key: 'complementaryKnowledge', count: myNeedUiHave.length });
        reasons.push(`Complementary knowledge (${myNeedUiHave.length})`);
    }
    const draining = seeker.needs.filter(n => cs.uDraining.includes(n));
    if (draining.length > 0) score -= draining.length * 2;
    return score;
}

function scoreSkillsRdgCauses(
    seeker: SeekerMatchContext,
    cs: CandidateSkills,
    crdg: CandidateRdg,
    sharedOffering: string[],
    out: { reasonTokens: MatchReasonToken[]; reasons: string[] },
): number {
    const { reasonTokens, reasons } = out;
    let score = 0;
    const canTeach = seeker.skillsOffered.filter(s => cs.uSkillsLearning.includes(s));
    if (canTeach.length > 0) score += canTeach.length * 2;
    const canLearn = cs.uSkillsOffered.filter(s => seeker.skillsLearning.includes(s));
    if (canLearn.length > 0) score += canLearn.length * 2;
    if (sharedOffering.length > 0) {
        score += sharedOffering.length;
        reasonTokens.push({ key: 'sharedSkills', count: sharedOffering.length });
        reasons.push(`Shared skills (${sharedOffering.length})`);
    }
    const rdgActive = seeker.rdgActive.filter(r => crdg.uRdgActive.includes(r));
    if (rdgActive.length > 0) {
        score += rdgActive.length * 1.5;
        reasonTokens.push({ key: 'sharedActiveRdg', count: rdgActive.length });
        reasons.push(`Shared active RDG (${rdgActive.length})`);
    }
    score += seeker.rdgInterested.filter(r => crdg.uRdgInterested.includes(r)).length * 0.75;
    const causeOverlap = seeker.causeIds.filter(id => crdg.uCauseIds.includes(id));
    if (causeOverlap.length > 0) {
        score += causeOverlap.length;
        reasonTokens.push({ key: 'sharedCauses', count: causeOverlap.length });
        reasons.push(`Shared causes (${causeOverlap.length})`);
    }
    return score;
}

function applyLanguageMultiplier(score: number, seeker: SeekerMatchContext, u: CandidateUser): number {
    const uLangs = (u.spokenLanguages || []);
    if (u.primaryLanguage && !uLangs.includes(u.primaryLanguage)) uLangs.push(u.primaryLanguage);
    if (!seeker.languages.some(l => uLangs.includes(l)) && seeker.languages.length > 0 && uLangs.length > 0) {
        score *= LANGUAGE_PENALTY;
    }
    return score;
}

function applyAvailabilityAndFocus(score: number, seeker: SeekerMatchContext, u: CandidateUser, reasonTokens: MatchReasonToken[], reasons: string[]): number {
    if (u.functionalProfile?.availabilityMode === 'DELIVERING') score *= DELIVERING_MULTIPLIER;
    const uFocusMode = u.functionalProfile?.focusMode;
    if (seeker.focusMode && uFocusMode && seeker.focusMode === uFocusMode) {
        score *= 1.25;
        reasonTokens.push({ key: 'sameFocusMode' });
        reasons.push('Same focus mode');
    }
    return score;
}

function applyLevelAndDecay(score: number, levelGap: number, hasProtectiveDampening: boolean, u: CandidateUser): number {
    if (levelGap <= 1) score *= 1.1;
    if (levelGap >= 3) score *= 0.8;
    if (hasProtectiveDampening) score *= 0.75;
    const ts = u.functionalProfile?.functionsUpdatedAt || u.createdAt;
    const decay = calculateFreshnessDecay(ts);
    if (decay < 1) score *= decay;
    return score;
}

function scorePair(seeker: SeekerMatchContext, u: CandidateUser): ScorePairResult {
    const cs = extractCandidateSkills(u);
    const crdg = extractCandidateRdg(u);
    const fp = u.functionalProfile;
    const uNeeds = (fp?.momentNeeds?.length ? fp.momentNeeds : cs.uSkillsLearning);
    const levelGap = Math.abs(seeker.level - cs.uLevel);
    const hasProtectiveDampening = getAsymmetryFlag(seeker.archetypes, cs.uArchetypes) === 'ASYMMETRIC_HISTORY';

    const sharedOffering = seeker.skillsOffered.filter(s => cs.uSkillsOffered.includes(s));
    const sharedLearning = seeker.skillsLearning.filter(s => cs.uSkillsLearning.includes(s));
    const myNeedUiHave = seeker.needs.filter(n => cs.uEnergising.includes(n) || cs.uSkillsOffered.includes(n));
    const uNeedMiHave = uNeeds.filter((n: string) => seeker.energising.includes(n) || seeker.skillsOffered.includes(n));

    const relType = computeRelType(levelGap, myNeedUiHave, uNeedMiHave, sharedOffering, sharedLearning);

    const reasonTokens: MatchReasonToken[] = [];
    const reasons: string[] = [];
    let score = scoreFunctionalFit(seeker, cs, myNeedUiHave, reasonTokens, reasons);
    score += scoreSkillsRdgCauses(seeker, cs, crdg, sharedOffering, { reasonTokens, reasons });
    score = applyLanguageMultiplier(score, seeker, u);
    score = applyAvailabilityAndFocus(score, seeker, u, reasonTokens, reasons);
    score = applyLevelAndDecay(score, levelGap, hasProtectiveDampening, u);

    return { score: Number.parseFloat(score.toFixed(1)), relType, reasons, reasonTokens };
}

function buildUserResult(
    seeker: SeekerMatchContext,
    u: CandidateUser,
    connectedUserIds: Set<string>,
    { score, relType, reasons, reasonTokens }: ScorePairResult,
): MatchResult {
    const publicProfile = getProfileExposureSettings(u.federationSettings);
    const canOpenProfile = canViewerOpenProfile({
        targetUserId: u.id,
        targetProfileVisibility: u.profileVisibility,
        viewerId: seeker.id,
        connectedUserIds,
    });
    return {
        id: u.id,
        type: 'USER',
        category: relType,
        title: u.displayName || u.name,
        subtitle: canExposeProfileField(publicProfile, 'showLocation') ? u.city || u.country || undefined : undefined,
        score,
        matchReasons: reasons.slice(0, 3),
        matchReasonTokens: reasonTokens.slice(0, 3),
        imageUrl: canExposeProfileField(publicProfile, 'showAvatar') ? u.profilePhoto || undefined : undefined,
        link: canOpenProfile ? `/profile/${u.id}` : undefined,
        canOpenProfile,
        isRecentlyActive: isRecentlyActive(u.lastActiveAt),
    };
}

function scoreUsers(seeker: SeekerMatchContext, otherUsers: CandidateUser[], connectedUserIds: Set<string>,
    rejectedIds: Set<string>): Record<string, MatchResult[]> {
    const results: MatchResult[] = [];

    for (const u of otherUsers) {
        if (!hasAvailableMemberPresence(u)) continue;
        if (rejectedIds.has(u.id)) continue;

        const { score, relType, reasons, reasonTokens } = scorePair(seeker, u);

        if (score > 1) {
            results.push(buildUserResult(seeker, u, connectedUserIds, { score, relType, reasons, reasonTokens }));
        }
    }

    results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

    return {
        COMPLEMENTARY_SYMMETRIC: results.filter(u => u.category === 'COMPLEMENTARY_SYMMETRIC').slice(0, 5),
        PEER: results.filter(u => u.category === 'PEER').slice(0, 5),
        FELLOW_TRAVELLER: results.filter(u => u.category === 'FELLOW_TRAVELLER').slice(0, 5),
        MENTOR_MENTEE: results.filter(u => u.category === 'MENTOR_MENTEE').slice(0, 3),
        OTHER: results.filter(u => !['COMPLEMENTARY_SYMMETRIC', 'PEER', 'FELLOW_TRAVELLER', 'MENTOR_MENTEE'].includes(u.category || '')).slice(0, 5),
    };
}

function scoreGeoAlignment(
    seeker: SeekerMatchContext,
    c: { city?: string | null; country?: string | null },
    reasonTokens: MatchReasonToken[],
    reasons: string[],
): number {
    if (seeker.city && c.city?.toLowerCase() === seeker.city) {
        reasonTokens.push({ key: 'sameCity' });
        reasons.push('Same city');
        return 3;
    }
    if (seeker.country && c.country?.toLowerCase() === seeker.country) {
        reasonTokens.push({ key: 'sameCountry' });
        reasons.push('Same country');
        return 1;
    }
    return 0;
}

function scoreCommunities(seeker: SeekerMatchContext, communities: CandidateCommunity[]): MatchResult[] {
    const results: MatchResult[] = [];

    for (const c of communities) {
        let score = 0;
        const reasons: string[] = [];
        const reasonTokens: MatchReasonToken[] = [];

        score += scoreGeoAlignment(seeker, c, reasonTokens, reasons);

        const cFocus = new Set<string>(c.focusAreas.map((f: { focusArea: string }) => f.focusArea));
        const activeOverlap = seeker.rdgActive.filter(r => cFocus.has(r));
        if (activeOverlap.length > 0) {
            score += activeOverlap.length * 2;
            reasonTokens.push({ key: 'sharedRdgProfile', count: activeOverlap.length });
            reasons.push(`Shared RDG profile (${activeOverlap.length})`);
        }
        const interestOverlap = seeker.rdgInterested.filter(r => cFocus.has(r));
        if (interestOverlap.length > 0) {
            score += interestOverlap.length * 1;
        }

        const communityBaseScore = calculateCommunityMatchScore(seeker.rawUser, c);
        score += communityBaseScore;
        if (communityBaseScore > 30) {
            reasonTokens.push({ key: 'strongRoleLabelFit' });
            reasons.push('Strong role-label fit');
        }

        if (score > 0) {
            results.push({
                id: c.id,
                type: 'COMMUNITY',
                title: c.name,
                subtitle: c.type,
                score: Number.parseFloat(score.toFixed(1)),
                matchReasons: reasons,
                matchReasonTokens: reasonTokens,
                imageUrl: c.coverImage || undefined,
                link: `/communities/${c.id}`,
            });
        }
    }

    results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return results;
}

function scoreCauses(seeker: SeekerMatchContext, causes: CandidateCause[]): MatchResult[] {
    const results: MatchResult[] = [];

    for (const cause of causes) {
        let score = 0;
        const reasons: string[] = [];
        const reasonTokens: MatchReasonToken[] = [];

        const causeDomains: string[] = cause.rdgDomains || [];
        const domainOverlap = seeker.rdgActive.filter(d => causeDomains.includes(d));
        if (domainOverlap.length > 0) {
            score += domainOverlap.length * 4;
            reasonTokens.push({ key: 'sharedFocusArea', count: domainOverlap.length });
            reasons.push(`Shared focus area (${domainOverlap.length})`);
        }

        const causeNeeds: string[] = cause.neededFunctions || [];
        const skillOverlap = seeker.skillsOffered.filter(s => causeNeeds.includes(s));
        const energisingOverlap = seeker.energising.filter(e => causeNeeds.includes(e));
        if (skillOverlap.length > 0 || energisingOverlap.length > 0) {
            const totalFuncOverlap = skillOverlap.length + energisingOverlap.length;
            score += totalFuncOverlap * 3;
            reasonTokens.push({ key: 'needsYourEnergy' });
            reasons.push('Needs your knowledge or energy');
        }

        if (score > 4) {
            results.push({
                id: cause.id,
                type: 'CAUSE',
                title: cause.title,
                subtitle: causeDomains.slice(0, 2).join(', '),
                score: Number.parseFloat(score.toFixed(1)),
                matchReasons: reasons,
                matchReasonTokens: reasonTokens,
                imageUrl: cause.coverImage || undefined,
                link: `/causes/${cause.id}`,
            });
        }
    }

    results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return results;
}

async function loadDismissParticipants(seekerId: string, candidateId: string) {
    const [seeker, candidate] = await Promise.all([
        prisma.user.findUnique({ where: { id: seekerId }, select: { archetypes: true } }),
        prisma.user.findUnique({ where: { id: candidateId, deletedAt: null }, select: { archetypes: true } }),
    ]);
    if (!seeker?.archetypes?.length || !candidate?.archetypes?.length) return null;
    return { seekerArchetype: seeker.archetypes[0], candidateArchetype: candidate.archetypes[0] };
}

export async function dismissMatch(candidateUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const authResult = await getCurrentUser();
        if (!authResult.success || !authResult.data?.user) {
            return { success: false, error: 'matchmaking.errors.authRequired' };
        }
        const seekerId = authResult.data.user.id;

        const participants = await loadDismissParticipants(seekerId, candidateUserId);
        if (!participants) {
            return { success: false, error: 'matchmaking.errors.cannotDismiss' };
        }

        await prisma.matchRejectionLog.create({
            data: {
                targetUserId: seekerId,
                targetUserArchetype: participants.seekerArchetype,
                candidateArchetype: participants.candidateArchetype,
                candidateUserId,
            },
        });

        revalidatePath('/matchmaking');
        return { success: true };
    } catch (error) {
        if (isDynamicServerUsageError(error)) throw error;
        logActionError('dismissMatch', error);
        return { success: false, error: 'matchmaking.errors.unexpectedError' };
    }
}

// Load the seeker's full matchmaking profile. Field selection kept identical to the
// prior inline query so scoring behaviour is unchanged.
function loadSeekerUser(currentUserId: string) {
    return prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
            id: true, email: true, name: true, availability: true,
            profileVisibility: true, federationSettings: true, changemakeLevel: true,
            archetypes: true, rdgAreas: true, city: true, country: true,
            spokenLanguages: true, primaryLanguage: true,
            skills: { select: { skill: true, skillType: true } },
            functionalProfile: { select: { availabilityMode: true, rdgMain: true, rdgInterested: true, energisingFunctions: true, drainingFunctions: true, focusMode: true, momentNeeds: true, protectionNeeds: true, functionsUpdatedAt: true } },
            mainCauses: { select: { id: true } },
            interestedCauses: { select: { id: true } },
            deletedAt: true, inactiveAt: true, isAdmin: true, isEmailVerified: true,
            isRegistrationPending: true, isSuspended: true, processingRestricted: true,
            termsAcceptedAt: true,
            onboardingState: { select: { lastStageCompleted: true } },
            declineAlgorithmicMatching: true, allowSensitiveMatching: true,
            specialCategoryConsentWithdrawnAt: true, profilePhoto: true, bio: true,
            website: true, organizationName: true, socialLinks: true,
        },
    });
}

type SeekerUser = NonNullable<Awaited<ReturnType<typeof loadSeekerUser>>>;

function resolveSeekerLanguages(currentUser: SeekerUser): string[] {
    const langs = currentUser.spokenLanguages || [];
    if (currentUser.primaryLanguage && !langs.includes(currentUser.primaryLanguage)) {
        langs.push(currentUser.primaryLanguage);
    }
    return langs;
}

function resolveSeekerSkillsAndNeeds(currentUser: SeekerUser) {
    const skillsOffered = currentUser.skills.filter(s => s.skillType === 'OFFERED').map(s => s.skill);
    const skillsLearning = currentUser.skills.filter(s => s.skillType === 'SEEKING').map(s => s.skill);
    const fp = currentUser.functionalProfile;
    const energising = fp?.energisingFunctions || [];
    const needs = fp?.momentNeeds?.length ? fp.momentNeeds : skillsLearning;
    return { skillsOffered, skillsLearning, energising, needs };
}

function resolveSeekerRdgAndCauses(currentUser: SeekerUser) {
    const fp = currentUser.functionalProfile;
    return {
        rdgActive: fp?.rdgMain || currentUser.rdgAreas || [],
        rdgInterested: fp?.rdgInterested || [],
        protectionNeeds: fp?.protectionNeeds || [],
        causeIds: currentUser.mainCauses.map(c => c.id),
    };
}

function buildSeekerContext(currentUserId: string, currentUser: SeekerUser): SeekerMatchContext {
    const fp = currentUser.functionalProfile;
    const { skillsOffered, skillsLearning, energising, needs } = resolveSeekerSkillsAndNeeds(currentUser);
    const { rdgActive, rdgInterested, protectionNeeds, causeIds } = resolveSeekerRdgAndCauses(currentUser);
    return {
        id: currentUserId,
        level: levelMap[currentUser.changemakeLevel] || 0,
        archetypes: currentUser.archetypes || [],
        languages: resolveSeekerLanguages(currentUser),
        focusMode: fp?.focusMode,
        skillsOffered, skillsLearning, energising, needs,
        rdgActive, rdgInterested, causeIds, protectionNeeds,
        city: currentUser.city?.toLowerCase(),
        country: currentUser.country?.toLowerCase(),
        rawUser: currentUser,
    };
}

// Load every candidate set plus the connected/rejected id lookups in one round-trip.
async function loadMatchCandidates(currentUserId: string) {
    const rejectionCutoff = new Date(Date.now() - REJECTION_SUPPRESSION_DAYS * 24 * 60 * 60 * 1000);

    const [otherUsers, communities, causes, acceptedConnections, recentRejections] = await Promise.all([
        prisma.user.findMany({
            where: getMatchableMemberWhereInput({ id: { not: currentUserId } }),
            take: 200,
            select: {
                id: true, displayName: true, name: true, profilePhoto: true,
                city: true, country: true, availability: true, profileVisibility: true,
                federationSettings: true, changemakeLevel: true, archetypes: true,
                spokenLanguages: true, primaryLanguage: true, createdAt: true, lastActiveAt: true,
                rdgAreas: true,
                skills: { select: { skill: true, skillType: true } },
                functionalProfile: { select: { availabilityMode: true, energisingFunctions: true, drainingFunctions: true, focusMode: true, momentNeeds: true, sustainabilityMap: true, rdgMain: true, rdgInterested: true, functionsUpdatedAt: true } },
                mainCauses: { select: { id: true } },
            },
        }),
        prisma.community.findMany({
            where: { visibility: 'PUBLIC' },
            take: 100,
            select: {
                id: true, name: true, type: true, city: true, country: true, coverImage: true,
                focusAreas: { select: { focusArea: true } },
                values: { select: { value: true } },
                socialCauses: { select: { id: true } },
            },
        }),
        prisma.socialCause.findMany({
            take: 100,
            select: { id: true, title: true, slug: true, coverImage: true, rdgDomains: true, neededFunctions: true },
        }),
        prisma.connection.findMany({
            where: { status: 'ACCEPTED', deletedAt: null, OR: [{ senderId: currentUserId }, { receiverId: currentUserId }] },
            select: { senderId: true, receiverId: true },
            take: 500,
        }),
        prisma.matchRejectionLog.findMany({
            where: { targetUserId: currentUserId, createdAt: { gte: rejectionCutoff }, candidateUserId: { not: null } },
            select: { candidateUserId: true },
        }),
    ]);

    const connectedUserIds = new Set(
        acceptedConnections.map(c => (c.senderId === currentUserId ? c.receiverId : c.senderId))
    );
    const rejectedIds = new Set(recentRejections.map(r => r.candidateUserId as string));

    return { otherUsers, communities, causes, connectedUserIds, rejectedIds };
}

export async function getMatchmakingRecommendations(): Promise<{ success: boolean; data?: { users: Record<string, MatchResult[]>; communities: MatchResult[]; causes: MatchResult[] }; error?: string }> {
    try {
        const authResult = await getCurrentUser();
        if (!authResult.success || !authResult.data?.user) {
            return { success: false, error: 'matchmaking.errors.authRequired' };
        }

        const currentUserId = authResult.data.user.id;
        const currentUser = await loadSeekerUser(currentUserId);

        if (!currentUser || !isMatchableMemberAccount(currentUser)) {
            return { success: true, data: { users: {}, communities: [], causes: [] } };
        }

        const seeker = buildSeekerContext(currentUserId, currentUser);
        const { otherUsers, communities, causes, connectedUserIds, rejectedIds } =
            await loadMatchCandidates(currentUserId);

        return {
            success: true,
            data: {
                users: scoreUsers(seeker, otherUsers, connectedUserIds, rejectedIds),
                communities: scoreCommunities(seeker, communities).slice(0, 10),
                causes: scoreCauses(seeker, causes).slice(0, 10),
            },
        };

    } catch (error) {
        if (isDynamicServerUsageError(error)) {
            throw error;
        }
        logActionError('getMatchmakingRecommendations', error);
        return { success: false, error: 'matchmaking.errors.unexpectedError' };
    }
}
