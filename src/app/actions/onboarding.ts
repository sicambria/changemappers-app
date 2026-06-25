'use server';

import { localizeActionZodError } from '@/lib/action-result-i18n';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import prisma, { Visibility, LocationPrecision, NetworkRole, DecisionMakingType, ResourceSharingType, SocialIntimacyType, CommunitySizeType, AvailabilityMode, WorkContextScale } from '@/lib/prisma';
import { normalizeCoordinatesForPrecision } from '@/lib/location-precision';
import {
  stage2Schema,
  stage2_5Schema,
  stage3Schema,
  stage4Schema,
  stage4_5Schema,
  stage5Schema,
  stage6Schema,
} from '@/lib/onboarding-schemas';
import { getCurrentUser } from './auth';
import { calculateArchetypes } from '@/lib/matchmaking/archetypeCalc';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';


// ──────────────────────────────────────────────
// Helper: get authenticated user id
// ──────────────────────────────────────────────

async function getAuthUserId(overrideUserId?: string): Promise<string | null> {
    const res = await getCurrentUser();
    if (!res.success || !res.data) return null;

    const currentUser = res.data.user;
    if (!overrideUserId) return currentUser.id;

    if (overrideUserId === currentUser.id || currentUser.isAdmin === true) {
        return overrideUserId;
    }

    return null;
}

// ──────────────────────────────────────────────
// Get onboarding state (for resuming flow)
// ──────────────────────────────────────────────

export async function getOnboardingState() {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
  const state = await prisma.userOnboardingState.findUnique({
      where: { userId },
      select: {
        userId: true,
        lastStageCompleted: true,
        agreementsAcceptedAt: true,
        agreementsVersion: true,
        charterVersion: true,
        charterAcceptedAt: true,
        stage2CompletedAt: true,
        stage2_5CompletedAt: true,
        stage3CompletedAt: true,
        stage4CompletedAt: true,
        stage4_5CompletedAt: true,
        stage5CompletedAt: true,
        stage6CompletedAt: true,
        orientationSeenAt: true,
      },
    });
        return { success: true, data: state };
    } catch {
        return { success: false, error: 'Failed to load onboarding state' };
    }
}

// ──────────────────────────────────────────────
// Stage 2: Save platform agreements
// ──────────────────────────────────────────────

export async function saveAgreementsAction(formData: FormData, overrideUserId?: string) {
    const userId = await getAuthUserId(overrideUserId);
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const raw = Object.fromEntries(formData.entries());
        // Convert checkbox presence to boolean
        const validated = stage2Schema.parse({
            pledge_contributor: raw.pledge_contributor === 'on',
            pledge_difference: raw.pledge_difference === 'on',
            pledge_friction: raw.pledge_friction === 'on',
            pledge_share: raw.pledge_share === 'on',
            pledge_notice: raw.pledge_notice === 'on',
            pledge_accountability: raw.pledge_accountability === 'on',
            charter_accepted: raw.charter_accepted === 'on',
        });

        if (!Object.values(validated).every(Boolean)) {
            return { success: false, error: 'All agreements must be accepted' };
        }

        const now = new Date();
        await prisma.userOnboardingState.upsert({
            where: { userId },
            create: {
                userId,
                lastStageCompleted: 2,
                agreementsAcceptedAt: now,
                agreementsVersion: LEGAL_VERSIONS.communityAgreements,
                charterVersion: LEGAL_VERSIONS.charter,
                charterAcceptedAt: now,
                stage2CompletedAt: now,
            },
            update: {
                lastStageCompleted: 2,
                agreementsAcceptedAt: now,
                agreementsVersion: LEGAL_VERSIONS.communityAgreements,
                charterVersion: LEGAL_VERSIONS.charter,
                charterAcceptedAt: now,
                stage2CompletedAt: now,
            },
        });

        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'All agreements must be accepted' };
        }
        return { success: false, error: 'Failed to save agreements' };
    }
}

// ──────────────────────────────────────────────
// Stage 2.5: Assessment
// ──────────────────────────────────────────────

export async function saveAssessmentAction(data: z.infer<typeof stage2_5Schema>, overrideUserId?: string) {
    const userId = await getAuthUserId(overrideUserId);
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = stage2_5Schema.parse(data);
        const now = new Date();

        // Server-side calculation matches business logic exactly
        let newLevel = 2;
        if (validated.q3_activity != null && validated.q3_activity > 3) newLevel += 1;
        if (validated.q4_project === 'igen' || validated.q4_project === 'yes') newLevel += 1;
        if (validated.q5_systemic != null && validated.q5_systemic > 3) newLevel += 1;
        if (validated.q2_focus === 'global') newLevel += 2;
        const finalLevel = Math.min(9, Math.max(0, newLevel));

        await prisma.$transaction([
            prisma.userFunctionalProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    cmapLevel: finalLevel,
                    assessmentResponses: validated,
                },
                update: {
                    cmapLevel: finalLevel,
                    assessmentResponses: validated,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    seekingLocalEcoCommunity: validated.seekingLocalEcoCommunity ?? false,
                    seekingIntentionalCommunity: validated.seekingIntentionalCommunity ?? false,
                    highStakesProjectHelp: validated.highStakesProjectHelp ?? false,
                    strictNoRomance: validated.strictNoRomance ?? false,
                },
                select: { id: true },
            }),
            prisma.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 3, stage2_5CompletedAt: now }, // it is logically stage 2.5
                update: { lastStageCompleted: { set: 3 }, stage2_5CompletedAt: now },
            }),
        ]);

        return { success: true, cmapLevel: finalLevel };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
        }
        return { success: false, error: 'Failed to save assessment' };
    }
}

// ──────────────────────────────────────────────
// Stage 3: Presence / Public Face
// ──────────────────────────────────────────────

export async function savePresenceAction(data: z.infer<typeof stage3Schema>, overrideUserId?: string) {
    const userId = await getAuthUserId(overrideUserId);
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = stage3Schema.parse(data);
        const normalizedCoordinates = normalizeCoordinatesForPrecision(validated.latitude, validated.longitude, validated.locationPrecision);
        const now = new Date();

        const _updatedUser = await prisma.$transaction(async (tx) => {
            const _existingState = await tx.userOnboardingState.findUnique({
						where: { userId },
						select: { userId: true },
					});

		const userUpdate = await tx.user.update({
			where: { id: userId },
			data: {
				motto: validated.tagline,
				bio: validated.bio,
				city: validated.city,
				country: validated.country,
				latitude: normalizedCoordinates.latitude,
				longitude: normalizedCoordinates.longitude,
				locationPrecision: validated.locationPrecision as LocationPrecision,
				website: validated.website || null,
				isRemoteCapable: validated.isRemoteCapable,
				profilePhoto: validated.profilePhoto || null,
				organizationName: validated.organizationName || null,
				organizationDescription: validated.organizationDescription || null,
				locationVisibility: validated.locationVisibility as Visibility,
				onboardingState: {
					upsert: {
						create: {
							lastStageCompleted: 3,
							stage3CompletedAt: now,
						},
						update: {
							lastStageCompleted: 3,
							stage3CompletedAt: now,
						}
					}
				}
			},
            select: { id: true }
		});

            // Handle Community Assignment
            if (validated.communityId) {
                // Check if already a member
const existingMember = await tx.communityMember.findUnique({
						where: {
							communityId_userId: { communityId: validated.communityId, userId }
						},
						select: { id: true },
					});
                if (!existingMember) {
                    await tx.communityMember.create({
                        data: {
                            communityId: validated.communityId,
                            userId,
                            role: 'MEMBER',
                            status: 'ACTIVE'
                        }
                    });
                }
            } else if (validated.newCommunityName) {
                // Check if a community with this exact name exists to avoid overlap
const existingComm = await tx.community.findFirst({
						where: { name: { equals: validated.newCommunityName, mode: 'insensitive' } },
						select: { id: true, name: true },
					});

                let finalCommId = existingComm?.id;

                if (!existingComm) {
                    const newComm = await tx.community.create({
                        data: {
                            name: validated.newCommunityName,
                            type: 'OTHER',
                            visibility: 'PUBLIC',
                            ownerId: userId,
                            acceptingMembers: 'ACCEPTING',
                        }
                    });
                    finalCommId = newComm.id;
                }

                // Add user as member/owner
                const role = existingComm ? 'MEMBER' : 'OWNER';

const existingMember = await tx.communityMember.findUnique({
						where: {
							communityId_userId: { communityId: finalCommId as string, userId }
						},
						select: { id: true },
					});
                if (!existingMember) {
                    await tx.communityMember.create({
                        data: {
                            communityId: finalCommId as string,
                            userId,
                            role: role,
                            status: 'ACTIVE'
                        }
                    });
                }
            }

            return userUpdate;
        });

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
        }
        return { success: false, error: 'Failed to save presence' };
    }
}

// ──────────────────────────────────────────────
// Stage 4: Skills & Learning
// ──────────────────────────────────────────────

export async function saveSkillsLearningAction(data: z.infer<typeof stage4Schema>, overrideUserId?: string) {
  const userId = await getAuthUserId(overrideUserId);
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    const validated = stage4Schema.parse(data);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Stage 4 owns the profile exchange skills: offers and learning/needs.
      await tx.userSkill.deleteMany({ where: { userId } });

      const skillRecords = [
        ...(validated.skills?.map(s => ({ userId, skill: s, skillType: 'OFFERED' as const })) ?? []),
        ...(validated.learning?.map(s => ({ userId, skill: s, skillType: 'SEEKING' as const })) ?? []),
      ];

      if (skillRecords.length) {
        await tx.userSkill.createMany({ data: skillRecords, skipDuplicates: true });
      }

      const updateData: Record<string, unknown> = {};
      if (validated.baseArchetypes?.length) {
        // Preserve existing EXTRA (quiz) archetypes, replace BASE archetypes
        const currentUser2 = await tx.user.findUnique({
          where: { id: userId },
          select: { archetypes: true },
        });
        const existingExtra = (currentUser2?.archetypes ?? []).filter(a => !BASE_ARCHETYPES.has(a as string));
        updateData.archetypes = [...new Set([...validated.baseArchetypes, ...existingExtra])];
      }

      const resolveCauseId = async (causeIdOrSlug: string): Promise<string | null> => {
        const existingCause = await tx.socialCause.findFirst({
          where: {
            OR: [
              { slug: causeIdOrSlug },
              { id: causeIdOrSlug },
            ],
          },
          select: { id: true },
        });

        if (existingCause) return existingCause.id;

        const title = causeIdOrSlug
          .replaceAll(/[-_]+/g, ' ')
          .replaceAll(/\b\w/g, (char) => char.toUpperCase());
        const createdCause = await tx.socialCause.create({
          data: {
            slug: causeIdOrSlug,
            title,
            rdgDomains: [],
            neededFunctions: [],
          },
          select: { id: true },
        });
        return createdCause.id;
      };

      if (validated.mainCauses !== undefined && validated.mainCauses.length > 0) {
        const causeConnections = await Promise.all(validated.mainCauses.map(resolveCauseId));
        const validCauseIds = causeConnections.filter((id): id is string => id !== null);
        if (validCauseIds.length > 0) {
          updateData.mainCauses = { set: validCauseIds.map(id => ({ id })) };
        }
      }

      if (validated.interestedCauses !== undefined && validated.interestedCauses.length > 0) {
        const causeConnections = await Promise.all(validated.interestedCauses.map(resolveCauseId));
        const validCauseIds = causeConnections.filter((id): id is string => id !== null);
        if (validCauseIds.length > 0) {
          updateData.interestedCauses = { set: validCauseIds.map(id => ({ id })) };
        }
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateData,
          select: { id: true },
        });
      }

      if (validated.protectionNeeds !== undefined) {
        await tx.userFunctionalProfile.update({
          where: { userId },
          data: { protectionNeeds: validated.protectionNeeds }
        }).catch(() => {
          // Ignore if functional profile doesn't exist yet (though it should from Stage 2.5)
        });
      }

      await tx.userOnboardingState.upsert({
        where: { userId },
        create: { userId, lastStageCompleted: 4, stage4CompletedAt: now },
        update: { lastStageCompleted: { set: 4 }, stage4CompletedAt: now },
      });
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
    }
    return { success: false, error: 'Failed to save skills' };
  }
}

// ──────────────────────────────────────────────
// Stage 4.5: Community Archetypes
// ──────────────────────────────────────────────

// Base archetype values — must stay in sync with prisma/schema.prisma Archetype enum
const BASE_ARCHETYPES = new Set([
    'LOCAL_PRACTITIONER', 'NETWORK_WEAVER', 'INSTITUTIONAL_CHANGEMAKER', 'GLOBAL_AMPLIFIER',
    'RESOURCE_MOBILIZER', 'INNOVATION_CATALYST', 'SYSTEM_DISRUPTOR', 'STRATEGIC_ADVISOR',
]);

export async function saveArchetypeAction(data: z.infer<typeof stage4_5Schema>, overrideUserId?: string) {
  const userId = await getAuthUserId(overrideUserId);
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    const validated = stage4_5Schema.parse(data);
    const now = new Date();

    // Validate that roles are valid NetworkRole enum values
    const validNetworkRoles = Object.values(NetworkRole);
    const invalidRoles = (validated.roles || []).filter(
      role => !validNetworkRoles.includes(role as NetworkRole)
    );
    if (invalidRoles.length > 0) {
      return {
        success: false,
        error: `Invalid network roles: ${invalidRoles.join(', ')}. Valid roles are: ${validNetworkRoles.join(', ')}`
      };
    }

    const calculatedArchetype = calculateArchetypes({
      roles: (validated.roles as NetworkRole[]) || [],
      internalExternal: validated.internalExternal || 5,
      secularSpiritual: validated.secularSpiritual || 5,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decisionMaking: validated.decisionMaking ? (validated.decisionMaking.toUpperCase() as any) : null,
      resourceSharing: validated.resourceSharing as ResourceSharingType,
      comfortLevel: validated.comfortLevel || 5,
      socialIntimacy: validated.socialIntimacy as SocialIntimacyType
    });

    // Preserve any existing BASE archetypes the user has selected — only replace/add the quiz result
    const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { archetypes: true } });
    const existingBase = (existingUser?.archetypes ?? []).filter(a => BASE_ARCHETYPES.has(a as string));
    // Merge: keep base archetypes + the new quiz result (deduplicated)
    const mergedArchetypes = [...new Set([...existingBase, calculatedArchetype])];

    await prisma.$transaction([
      prisma.userFunctionalProfile.upsert({
        where: { userId },
        create: {
          userId,
          energisingFunctions: [],
          drainingFunctions: [],
          networkRoles: (validated.roles as NetworkRole[]) || [],
          internalExternalFocus: validated.internalExternal,
          secularSpiritualFocus: validated.secularSpiritual,
          decisionMaking: validated.decisionMaking ? (validated.decisionMaking.toUpperCase() as DecisionMakingType) : null,
          resourceSharing: validated.resourceSharing as ResourceSharingType,
          comfortLevel: validated.comfortLevel,
          socialIntimacy: validated.socialIntimacy as SocialIntimacyType,
          // Note: communityPresence logic needs enum mapping
          communityPresence: [],
          communitySize: validated.communitySize as CommunitySizeType,
        },
        update: {
          networkRoles: (validated.roles as NetworkRole[]) || [],
          internalExternalFocus: validated.internalExternal,
          secularSpiritualFocus: validated.secularSpiritual,
          decisionMaking: validated.decisionMaking ? (validated.decisionMaking.toUpperCase() as DecisionMakingType) : null,
          resourceSharing: validated.resourceSharing as ResourceSharingType,
          comfortLevel: validated.comfortLevel,
          socialIntimacy: validated.socialIntimacy as SocialIntimacyType,
          // Note: communityPresence logic needs enum mapping
          communityPresence: [],
          communitySize: validated.communitySize as CommunitySizeType,
          functionsUpdatedAt: now,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { archetypes: mergedArchetypes as any },
        select: { id: true },
      }),
      prisma.userOnboardingState.upsert({
        where: { userId },
        create: { userId, lastStageCompleted: 4, stage4_5CompletedAt: now },
        update: { lastStageCompleted: { set: 4 }, stage4_5CompletedAt: now },
      }),
    ]);

    return { success: true, calculatedArchetype };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
    }
    return { success: false, error: 'Failed to save archetypes' };
  }
}

// ──────────────────────────────────────────────
// Stage 5: Functional Context
// ──────────────────────────────────────────────

export async function saveFunctionalContextAction(data: z.infer<typeof stage5Schema>, overrideUserId?: string) {
    const userId = await getAuthUserId(overrideUserId);
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = stage5Schema.parse(data);
        const now = new Date();

        await prisma.$transaction([
            prisma.userFunctionalProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    energisingFunctions: validated.energisingFunctions,
                    drainingFunctions: validated.drainingFunctions,
                    availabilityMode: validated.availabilityMode as AvailabilityMode,
                    currentOffer: validated.currentOffer,
                    contributionSeedType: validated.contributionSeedType,
                    contributionSeedText: validated.contributionSeedText,
                    contributionSeedUpdatedAt: validated.contributionSeedText ? now : undefined,
                    workContextLastEffort: validated.workContextLastEffort,
                    workContextOutsideRole: validated.workContextOutsideRole,
                    workContextScale: validated.workContextScale as WorkContextScale,
                    rdgMain: validated.rdgMain || [],
                    rdgInterested: validated.rdgInterested || [],
                    // rdgProject and rdgPartnership are not actually on UserFunctionalProfile model currently
                    // based on schema inspection. If they are missing, we skip them or add them. I will skip for now to fix TS.
                    existentialRisks: { connect: validated.existentialRisks?.map(id => ({ id })) || [] },
                },
                update: {
                    energisingFunctions: validated.energisingFunctions,
                    drainingFunctions: validated.drainingFunctions,
                    availabilityMode: validated.availabilityMode as AvailabilityMode,
                    currentOffer: validated.currentOffer,
                    contributionSeedType: validated.contributionSeedType,
                    contributionSeedText: validated.contributionSeedText,
                    contributionSeedUpdatedAt: validated.contributionSeedText ? now : undefined,
                    workContextLastEffort: validated.workContextLastEffort,
                    workContextOutsideRole: validated.workContextOutsideRole,
                    workContextScale: validated.workContextScale as WorkContextScale,
                    rdgMain: validated.rdgMain || [],
                    rdgInterested: validated.rdgInterested || [],
                    existentialRisks: { set: validated.existentialRisks?.map(id => ({ id })) || [] },
                    functionsUpdatedAt: now,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { availability: validated.availabilityMode === 'RESTING' ? 'AWAY' : 'AVAILABLE' },
                select: { id: true },
            }),
            prisma.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 5, stage5CompletedAt: now },
                update: { lastStageCompleted: { set: 5 }, stage5CompletedAt: now },
            }),
        ]);

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
        }
        return { success: false, error: 'Failed to save functional context' };
    }
}

// ──────────────────────────────────────────────
// Stage 6: Functional Depth
// ──────────────────────────────────────────────

export async function saveFunctionalDepthAction(data: z.infer<typeof stage6Schema>, overrideUserId?: string) {
    const userId = await getAuthUserId(overrideUserId);
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const validated = stage6Schema.parse(data);
        const now = new Date();

        await prisma.$transaction([
            prisma.userFunctionalProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    energisingFunctions: [],
                    drainingFunctions: [],
                    scenarioResponses: validated.scenarioResponses ?? {},
                    avoidedFunctions: validated.avoidedFunctions ?? [],
                    currentProjectDescription: validated.currentProjectDescription,
                    momentNeeds: validated.momentNeeds ?? [],
                    currentActivities: validated.currentActivities ?? [],
                    desiredActivities: validated.desiredActivities ?? [],
                    developedSkills: { connect: validated.developedSkills?.map(id => ({ id })) || [] },
                    systemicExperience: validated.systemicExperience,
                    // systemicActivities and existentialActivities are not on model. Avoiding.
                },
                update: {
                    scenarioResponses: validated.scenarioResponses ?? {},
                    avoidedFunctions: validated.avoidedFunctions ?? [],
                    currentProjectDescription: validated.currentProjectDescription,
                    momentNeeds: validated.momentNeeds ?? [],
                    currentActivities: validated.currentActivities ?? [],
                    desiredActivities: validated.desiredActivities ?? [],
                    developedSkills: { set: validated.developedSkills?.map(id => ({ id })) || [] },
                    systemicExperience: validated.systemicExperience,
                    functionsUpdatedAt: now,
                },
            }),
            prisma.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 6, stage6CompletedAt: now },
                update: { lastStageCompleted: { set: 6 }, stage6CompletedAt: now },
            }),
        ]);

        // Store private scenario reflection as a ReflectionRecord if provided
        if (validated.scenarioReflection || validated.avoidanceReflection) {
            await prisma.reflectionRecord.create({
                data: {
                    userId,
                    level: 'L1_PULSE',
                    privateNotes: [
                        validated.scenarioReflection ? `Scenario reflection: ${validated.scenarioReflection}` : '',
                        validated.avoidanceReflection ? `Avoidance reflection: ${validated.avoidanceReflection}` : '',
                    ].filter(Boolean).join('\n\n'),
                    triggerContext: 'onboarding_stage_6',
                    activeFunctions: [],
                    unavailableFunctions: [],
                },
            });
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
        }
        return { success: false, error: 'Failed to save functional depth' };
    }
}

// ──────────────────────────────────────────────
// Stage 7: Mark orientation complete (ephemeral — no content stored)
// ──────────────────────────────────────────────

export async function completeOrientationAction(overrideUserId?: string) {
    const userId = await getAuthUserId(overrideUserId);
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        const now = new Date();
        await prisma.$transaction([
            prisma.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 7, orientationSeenAt: now },
                update: { lastStageCompleted: { set: 7 }, orientationSeenAt: now },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { profileCompleteness: 85 },
                select: { id: true },
            }),
        ]);
        revalidatePath('/');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to complete orientation' };
    }
}
