'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import prisma, { AvailabilityMode, ProjectReflectionPhase, ReflectionLevel } from '@/lib/prisma';
import { getCurrentUser } from './auth';

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
    const res = await getCurrentUser();
    return res.success && res.data ? res.data.user.id : null;
}

// ──────────────────────────────────────────────
// Level 1 — Current Pulse
// ──────────────────────────────────────────────

const pulseSchema = z.object({
    alignmentScore: z.number().int().min(1).max(5),
    energyScore: z.number().int().min(1).max(5),
    outsideFunctionScore: z.number().int().min(1).max(5),
    outsideFunctionByChoice: z.boolean().optional(),
    privateNotes: z.string().max(1000).optional(), // [PRIVATE]
});

export async function savePulseReflection(data: z.infer<typeof pulseSchema>) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = pulseSchema.parse(data);

        await prisma.reflectionRecord.create({
            data: {
                userId,
                level: 'L1_PULSE',
                alignmentScore: validated.alignmentScore,
                energyScore: validated.energyScore,
                outsideFunctionScore: validated.outsideFunctionScore,
                outsideFunctionByChoice: validated.outsideFunctionByChoice,
                // PRIVATE — never exposed in matching queries
                privateNotes: validated.privateNotes ?? null,
                triggerContext: 'user_initiated',
                activeFunctions: [],
                unavailableFunctions: [],
            },
        });

        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message };
        }
        return { success: false, error: 'Failed to save pulse' };
    }
}

// Fetch own pulse history [LONGITUDINAL — user's own data only]
export async function getPulseHistory(limit = 6) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, data: [] };

    const records = await prisma.reflectionRecord.findMany({
        where: { userId, level: ReflectionLevel.L1_PULSE },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            alignmentScore: true,
            energyScore: true,
            outsideFunctionScore: true,
            outsideFunctionByChoice: true,
            // DO NOT include privateNotes in list view — only in single record fetch
            createdAt: true,
        },
    });

    return { success: true, data: records };
}

// ──────────────────────────────────────────────
// Level 2 — Functional Availability Update
// ──────────────────────────────────────────────

const availabilityUpdateSchema = z.object({
    activeFunctions: z.array(z.string()),     // [MATCHING + PROFILE]
    unavailableFunctions: z.array(z.string()), // [MATCHING] — filter from suggestions
    availabilityMode: z.enum(['DELIVERING', 'BETWEEN', 'BUILDING', 'REFLECTING', 'RESTING']),
    updatedOfferSentence: z.string().max(200).optional(), // [PROFILE]
    privateContext: z.string().max(500).optional(),       // [PRIVATE] — why it shifted
});

export async function saveAvailabilityUpdate(data: z.infer<typeof availabilityUpdateSchema>) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = availabilityUpdateSchema.parse(data);
        const now = new Date();

        let userAvailability: 'AWAY' | 'BUSY' | 'AVAILABLE';
        if (validated.availabilityMode === 'RESTING') { userAvailability = 'AWAY'; }
        else if (validated.availabilityMode === 'REFLECTING') { userAvailability = 'BUSY'; }
        else { userAvailability = 'AVAILABLE'; }

        await prisma.$transaction([
            // Update functional profile [MATCHING]
            prisma.userFunctionalProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    availabilityMode: validated.availabilityMode as AvailabilityMode,
                    currentOffer: validated.updatedOfferSentence,
                    energisingFunctions: [],
                    drainingFunctions: [],
                    functionsUpdatedAt: now,
                },
                update: {
                    availabilityMode: validated.availabilityMode as AvailabilityMode,
                    currentOffer: validated.updatedOfferSentence,
                    functionsUpdatedAt: now,
                },
            }),
            // Update user availability [PROFILE]
            prisma.user.update({
                where: { id: userId },
                data: {
                    availability: userAvailability,
                    availabilityDetails: validated.updatedOfferSentence ? { offer: validated.updatedOfferSentence } : undefined,
                },
            }),
            // Create reflection record snapshot
            prisma.reflectionRecord.create({
                data: {
                    userId,
                    level: ReflectionLevel.L2_AVAILABILITY,
                    activeFunctions: validated.activeFunctions,
                    unavailableFunctions: validated.unavailableFunctions,
                    updatedOfferSentence: validated.updatedOfferSentence,
                    // PRIVATE — context for why it shifted
                    privateNotes: validated.privateContext ?? null,
                    triggerContext: 'user_initiated',
                },
            }),
        ]);

        revalidatePath('/profile');
        revalidatePath('/reflect');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message };
        }
        return { success: false, error: 'Failed to save availability update' };
    }
}

// ──────────────────────────────────────────────
// Level 3 — Project Reflection
// ──────────────────────────────────────────────

const projectReflectionSchema = z.object({
    projectName: z.string().min(1).max(200),
    phase: z.enum(['START', 'MID', 'CLOSURE', 'POST_CLOSURE']),
    // [MATCHING] — what functions are needed vs present
    neededFunctions: z.array(z.string()).optional(),
    presentFunctions: z.array(z.string()).optional(),
    // [LONGITUDINAL] — mid/closure data
    activeFunctions: z.array(z.string()).optional(),
    absentFunctions: z.array(z.string()).optional(),
    // [LONGITUDINAL] — what it became, what to carry
    whatItBecame: z.string().max(1000).optional(),
    whatToCarryForward: z.string().max(1000).optional(),
    // [PRIVATE] — honest notes, never used for matching
    privateNotes: z.string().max(2000).optional(),
});

export async function saveProjectReflection(data: z.infer<typeof projectReflectionSchema>) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = projectReflectionSchema.parse(data);

        await prisma.projectReflection.create({
            data: {
                userId,
                projectName: validated.projectName,
                phase: validated.phase as ProjectReflectionPhase,
                neededFunctions: validated.neededFunctions ?? [],
                presentFunctions: validated.presentFunctions ?? [],
                activeFunctions: validated.activeFunctions ?? [],
                absentFunctions: validated.absentFunctions ?? [],
                whatItBecame: validated.whatItBecame,
                whatToCarryForward: validated.whatToCarryForward,
                // PRIVATE — isolated field, never queried for matching
                privateNotes: validated.privateNotes ?? null,
            },
        });

        // If phase is START, use neededFunctions - presentFunctions gap to update momentNeeds on functional profile
        if (validated.phase === 'START' && validated.neededFunctions && validated.presentFunctions) {
            const gaps = validated.neededFunctions.filter(f => !(validated.presentFunctions ?? []).includes(f));
            if (gaps.length > 0) {
                await prisma.userFunctionalProfile.upsert({
                    where: { userId },
                    create: { userId, energisingFunctions: [], drainingFunctions: [], momentNeeds: gaps },
                    update: { momentNeeds: gaps, functionsUpdatedAt: new Date() },
                });
            }
        }

        revalidatePath('/reflect');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message };
        }
        return { success: false, error: 'Failed to save project reflection' };
    }
}

// Fetch own project reflections [LONGITUDINAL — user's own data only]
export async function getProjectReflections(projectName?: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, data: [] };

const records = await prisma.projectReflection.findMany({
  where: { userId, ...(projectName ? { projectName } : {}) },
  orderBy: { createdAt: 'desc' },
  take: 100,
  select: {
    id: true,
    projectName: true,
    phase: true,
    neededFunctions: true,
    presentFunctions: true,
    activeFunctions: true,
    absentFunctions: true,
    whatItBecame: true,
    whatToCarryForward: true,
    createdAt: true,
  },
});

    return { success: true, data: records };
}

// Fetch single record including private notes (own data only)
export async function getProjectReflectionById(id: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, data: null };

    const record = await prisma.projectReflection.findFirst({
      where: { id, userId },
      select: {
        id: true,
        projectName: true,
        phase: true,
        neededFunctions: true,
        presentFunctions: true,
        activeFunctions: true,
        absentFunctions: true,
        whatItBecame: true,
        whatToCarryForward: true,
        privateNotes: true,
        createdAt: true,
      }
    });

    return { success: true, data: record };
}

// ──────────────────────────────────────────────
// Get functional profile (for reflect hub summary)
// ──────────────────────────────────────────────

export async function getMyFunctionalProfile() {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, data: null };

    const profile = await prisma.userFunctionalProfile.findUnique({
        where: { userId },
        select: {
            availabilityMode: true,
            currentOffer: true,
            energisingFunctions: true,
            drainingFunctions: true,
            momentNeeds: true,
            functionsUpdatedAt: true,
            // DO NOT include scenarioResponses or avoidedFunctions here
            // (matching-only fields, not needed in hub summary)
        },
    });

    return { success: true, data: profile };
}
