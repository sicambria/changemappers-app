'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { SkillType, type Prisma } from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

/**
 * Validates the structure of imported user data
 */
const importDataSchema = z.object({
    version: z.number(),
    timestamp: z.string(),
    user: z.object({
        email: z.email(),
        name: z.string(),
        displayName: z.string().optional(),
        bio: z.string().optional(),
        archetypes: z.array(z.string()).optional(),
        location: z.string().optional(),
        skills: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
    }),
    // Add other related models here as they are implemented
    // items: z.array(itemSchema).optional(),
});

export type UserBackupData = z.infer<typeof importDataSchema>;

/**
 * Export a PARTIAL user-data backup (a small subset of profile fields) for the
 * local backup/restore round-trip paired with {@link importUserData}.
 *
 * @deprecated NOT a GDPR Article 20 export and must never be wired to the
 * data-export UI. The complete, rights-compliant export is
 * `buildGdprExportPayload` (`src/lib/gdpr/user-data.ts`), served by
 * `/api/gdpr/export` — the route the export UI already uses via
 * `exportUserDataAction`. This stub is retained for the backup/restore tests
 * only (2026-06-18 audit C10: keep the divergent stub out of the GDPR export
 * path). Prefer `buildGdprExportPayload` for anything user-facing.
 */
export async function exportUserData(userId: string): Promise<{ success: boolean; data?: UserBackupData; error?: string }> {
    try {
        const auth = await getCurrentUser();
        const currentUser = auth.success ? auth.data?.user : null;
        if (!currentUser) {
            return { success: false, error: 'Unauthorized' };
        }
        if (currentUser.id !== userId && !currentUser.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                name: true,
                displayName: true,
                bio: true,
                archetypes: true,
                city: true,       // location roughly maps to city/region in our model
                country: true,
                // skills and interests are relations in our model, usually
                // But for now, let's export what we have on the user object directly if they exist
                // or fetch relations if they are separate tables.
                // Based on previous context, skills/interests might be arrays on User or related tables.
                // Checking schema in User model from context:
                // interests: UserInterest[]
                // skills: UserSkill[]
            }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Fetch relations
  const skills = await prisma.userSkill.findMany({
  where: { userId },
  select: { skill: true },
  take: 200,
  });

  const interests = await prisma.userInterest.findMany({
  where: { userId },
  select: { interest: true },
  take: 200,
  });

        const backupData: UserBackupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            user: {
                email: user.email,
                name: user.name,
                displayName: user.displayName || undefined,
                bio: user.bio || undefined,
                archetypes: user.archetypes,
                location: user.city ? `${user.city}, ${user.country}` : undefined,
                skills: skills.map((s: { skill: string }) => s.skill),
                interests: interests.map((i: { interest: string }) => i.interest),
            }
        };

        return { success: true, data: backupData };

    } catch (error) {
        logActionError('Export failed', error);
        return { success: false, error: 'Failed to export data' };
    }
}

/**
 * Import user data from a JSON object
 * Note: This is a complex operation that needs to handle ID remapping and conflicts.
 * For this MVP/Audit compliance, we will implement a basic version that updates the user profile.
 */
export async function importUserData(userId: string, jsonInput: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = await getCurrentUser();
        const currentUser = auth.success ? auth.data?.user : null;
        if (!currentUser) {
            return { success: false, error: 'Unauthorized' };
        }
        if (currentUser.id !== userId && !currentUser.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const rawData = JSON.parse(jsonInput);
        const result = importDataSchema.safeParse(rawData);

        if (!result.success) {
            return { success: false, error: 'Invalid data format' };
        }

        const { user: userData } = result.data;

        // Transaction to update user data
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Update basic fields
            await tx.user.update({
                where: { id: userId },
                data: {
                    displayName: userData.displayName,
                    bio: userData.bio,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    archetypes: userData.archetypes as any,
                    // We don't overwrite email/name for security/identity reasons usually, 
                    // but for a full restore it might be needed. 
                    // For now, we update profile details.
                }
            });

            // 2. Handle relations (clear and recreate)
            if (userData.skills) {
                await tx.userSkill.deleteMany({ where: { userId } });
                if (userData.skills.length > 0) {
                    await tx.userSkill.createMany({
                        data: userData.skills.map((skill) => ({
                            userId,
                            skill,
                            skillType: SkillType.EXPERIENCE,
                        })),
                    });
                }
            }

            if (userData.interests) {
                await tx.userInterest.deleteMany({ where: { userId } });
                if (userData.interests.length > 0) {
                    await tx.userInterest.createMany({
                        data: userData.interests.map((interest) => ({
                            userId,
                            interest,
                        })),
                    });
                }
            }
        });

        revalidatePath('/profile');
        return { success: true };

    } catch (error) {
        logActionError('Import failed', error);
        return { success: false, error: 'Failed to import data' };
    }
}
