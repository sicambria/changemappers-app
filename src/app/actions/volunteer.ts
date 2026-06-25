'use server';
import { flattenError } from 'zod';

import { getRdgIdsForDomain } from '@/lib/taxonomy';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createVolunteerOpportunitySchema,
  updateVolunteerOpportunitySchema,
  createVolunteerApplicationSchema,
  updateVolunteerApplicationSchema,
  volunteerOpportunityFilterSchema,
  type CreateVolunteerOpportunityInput,
  type UpdateVolunteerOpportunityInput,
  type CreateVolunteerApplicationInput,
  type UpdateVolunteerApplicationInput,
  type VolunteerOpportunityFilterInput,
} from '@/lib/validations/volunteer';
import {
  CACHE_TAG_VOLUNTEER_OPPORTUNITIES,
  CACHE_TAG_VOLUNTEER_APPLICATIONS,
  volunteerOpportunityTag,
} from '@/lib/cache-tags';
import type { ApiResponse } from '@/types/modalities';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// OPPORTUNITY CRUD
// ─────────────────────────────────────────

export async function createVolunteerOpportunityAction(
  input: CreateVolunteerOpportunityInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createVolunteerOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  if (parsed.data.primaryRdgs.length < 1) {
    return { success: false, error: 'At least 1 RDG must be selected' };
  }

  const opportunity = await prisma.volunteerOpportunity.create({
    data: {
      ...parsed.data,
      requesterId: auth.data.id,
      status: 'DRAFT',
    },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_VOLUNTEER_OPPORTUNITIES, 'default');
  return { success: true, data: opportunity };
  });
}

export async function updateVolunteerOpportunityAction(
  id: string,
  input: UpdateVolunteerOpportunityInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('updateVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id },
    select: { requesterId: true },
  });
  if (!opportunity || opportunity.requesterId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  const parsed = updateVolunteerOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  await prisma.volunteerOpportunity.update({
    where: { id },
    data: parsed.data,
  });

  revalidateTag(CACHE_TAG_VOLUNTEER_OPPORTUNITIES, 'default');
  revalidateTag(volunteerOpportunityTag(id), 'default');
  return { success: true, data: { id } };
  });
}

export async function publishVolunteerOpportunityAction(id: string): Promise<ApiResponse<void>> {
  return runAction('publishVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id },
    select: { requesterId: true, primaryRdgs: true },
  });
  if (!opportunity || opportunity.requesterId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  if (opportunity.primaryRdgs.length < 1) {
    return { success: false, error: 'At least 1 RDG must be selected' };
  }

  await prisma.volunteerOpportunity.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  revalidateTag(CACHE_TAG_VOLUNTEER_OPPORTUNITIES, 'default');
  revalidateTag(volunteerOpportunityTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function deleteVolunteerOpportunityAction(id: string): Promise<ApiResponse<void>> {
  return runAction('deleteVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id },
    select: { requesterId: true },
  });
  if (!opportunity || opportunity.requesterId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  await prisma.volunteerOpportunity.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidateTag(CACHE_TAG_VOLUNTEER_OPPORTUNITIES, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// OPPORTUNITY QUERIES
// ─────────────────────────────────────────

export async function getVolunteerOpportunityAction(
  id: string,
): Promise<ApiResponse<{
  id: string;
  title: string;
  summary: string;
  description: string | null;
  primaryRdgs: string[];
  additionalRdgs: string[];
  socialCauseTopics: string[];
  impactScale: string | null;
  format: string;
  location: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  isRemoteCapable: boolean;
  commitmentType: string;
  startDate: Date | null;
  endDate: Date | null;
  eventDate: Date | null;
  applicationDeadline: Date | null;
  rollingApplications: boolean;
  moreInfoUrl: string | null;
  weeklyHours: number | null;
  totalHours: number | null;
  shiftLength: string | null;
  timePreference: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceLevel: string;
  beginnerFriendly: boolean;
  trainingProvided: boolean;
  ageSuitability: string | null;
  languageRequirements: string[];
  volunteersNeeded: number;
  teamBased: boolean;
  physicalEffort: string;
  physicalRequirements: string[];
  accessibilitySupported: string[];
  indoorOutdoor: string;
  weatherExposed: boolean;
  travelRequired: boolean;
  transportProvided: boolean;
  equipmentNeeded: string | null;
  dressCode: string | null;
  expectedImpact: string | null;
  impactMeasurement: string | null;
  backgroundCheckRequired: boolean;
  referencesRequired: boolean;
  codeOfConduct: boolean;
  workingWithVulnerable: boolean;
  supervisionLevel: string;
  riskLevel: string;
  requesterId: string;
  requesterType: string;
  organizationName: string | null;
  status: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
  requester: { id: string; name: string; displayName: string | null; profilePhoto: string | null };
  applicationCount: number;
  applications: Array<{ id: string; status: string; volunteerId: string }>;
}>> {
  return runAction('getVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  const currentUserId = auth.success && auth.data ? auth.data.id : null;

  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      primaryRdgs: true,
      additionalRdgs: true,
      socialCauseTopics: true,
      impactScale: true,
      format: true,
      location: true,
      region: true,
      latitude: true,
      longitude: true,
      isRemoteCapable: true,
      commitmentType: true,
      startDate: true,
      endDate: true,
      eventDate: true,
      applicationDeadline: true,
      rollingApplications: true,
      moreInfoUrl: true,
      weeklyHours: true,
      totalHours: true,
      shiftLength: true,
      timePreference: true,
      requiredSkills: true,
      niceToHaveSkills: true,
      experienceLevel: true,
      beginnerFriendly: true,
      trainingProvided: true,
      ageSuitability: true,
      languageRequirements: true,
      volunteersNeeded: true,
      teamBased: true,
      physicalEffort: true,
      physicalRequirements: true,
      accessibilitySupported: true,
      indoorOutdoor: true,
      weatherExposed: true,
      travelRequired: true,
      transportProvided: true,
      equipmentNeeded: true,
      dressCode: true,
      expectedImpact: true,
      impactMeasurement: true,
      backgroundCheckRequired: true,
      referencesRequired: true,
      codeOfConduct: true,
      workingWithVulnerable: true,
      supervisionLevel: true,
      riskLevel: true,
      requesterId: true,
      requesterType: true,
      organizationName: true,
      status: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      closedAt: true,
      requester: {
        select: { id: true, name: true, displayName: true, profilePhoto: true },
      },
      applications: {
        select: { id: true, status: true, volunteerId: true },
      },
    },
  });

  if (!opportunity) {
    return { success: false, error: 'Not found' };
  }

  const canViewApplications =
    currentUserId === opportunity.requesterId || (auth.success && auth.data?.isAdmin === true);

  return {
    success: true,
    data: {
      ...opportunity,
      applicationCount: opportunity.applications.length,
      applications: canViewApplications ? opportunity.applications : [],
    },
  };
  });
}

export async function getVolunteerOpportunitiesAction(
  input: VolunteerOpportunityFilterInput,
): Promise<ApiResponse<{
  opportunities: Array<{
    id: string;
    title: string;
    summary: string;
    primaryRdgs: string[];
    format: string;
    location: string | null;
    region: string | null;
    commitmentType: string;
    rollingApplications: boolean;
    applicationDeadline: Date | null;
    volunteersNeeded: number;
    createdAt: Date;
    requester: { id: string; name: string; organizationName: string | null };
    _count: { applications: number };
  }>;
  total: number;
  hasMore: boolean;
}>> {
  return runAction('getVolunteerOpportunitiesAction', async () => {
  const parsed = volunteerOpportunityFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const { page, limit, rdgDomain, specificRdg, topic, impactScale, format, commitmentType, experienceLevel, rollingApplications, search, lat, lng, radiusKm } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
    deletedAt: null,
    visibility: 'PUBLIC',
  };

  if (rdgDomain) {
    const ids = getRdgIdsForDomain(rdgDomain);
    if (ids.length > 0) {
      where.primaryRdgs = { hasSome: ids };
    }
  }

  if (specificRdg) {
    where.primaryRdgs = { has: specificRdg };
  }

  if (topic) {
    where.socialCauseTopics = { has: topic };
  }

  if (impactScale) { where.impactScale = impactScale; }
  if (format) { where.format = format; }
  if (commitmentType) { where.commitmentType = commitmentType; }
  if (experienceLevel) { where.experienceLevel = experienceLevel; }
  if (rollingApplications !== undefined) { where.rollingApplications = rollingApplications; }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (lat && lng && radiusKm) {
    const radiusDegrees = radiusKm / 111;
    where.latitude = { gte: lat - radiusDegrees, lte: lat + radiusDegrees };
    where.longitude = { gte: lng - radiusDegrees, lte: lng + radiusDegrees };
  }

const [opportunities, total] = await Promise.all([
      prisma.volunteerOpportunity.findMany({
        where,
        select: {
          id: true,
          title: true,
          summary: true,
          primaryRdgs: true,
          format: true,
          location: true,
          region: true,
          commitmentType: true,
          rollingApplications: true,
          applicationDeadline: true,
          volunteersNeeded: true,
          createdAt: true,
          requester: {
            select: { id: true, name: true, organizationName: true },
          },
          _count: { select: { applications: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.volunteerOpportunity.count({ where }),
    ]);

  return {
    success: true,
    data: {
      opportunities,
      total,
      hasMore: skip + opportunities.length < total,
    },
  };
  });
}

// ─────────────────────────────────────────
// APPLICATION CRUD
// ─────────────────────────────────────────

export async function createVolunteerApplicationAction(
  input: CreateVolunteerApplicationInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createVolunteerApplicationAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const user = await prisma.userFunctionalProfile.findUnique({
    where: { userId: auth.data.id },
    select: { availabilityMode: true },
  });
  const mode = user?.availabilityMode;
  const isAvailable = mode ? mode !== 'RESTING' && mode !== 'REFLECTING' : true;
  if (!isAvailable) {
    return { success: false, error: 'You are not currently available for new commitments' };
  }

  const parsed = createVolunteerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id: parsed.data.opportunityId },
    select: { status: true, volunteersNeeded: true },
  });
  if (opportunity?.status !== 'PUBLISHED') {
    return { success: false, error: 'Opportunity not available' };
  }

  const existingApplication = await prisma.volunteerApplication.findUnique({
    where: {
      opportunityId_volunteerId: {
        opportunityId: parsed.data.opportunityId,
        volunteerId: auth.data.id,
      },
    },
    select: { id: true },
  });
  if (existingApplication) {
    return { success: false, error: 'You have already applied' };
  }

  const application = await prisma.volunteerApplication.create({
    data: {
      ...parsed.data,
      volunteerId: auth.data.id,
      status: 'PENDING',
    },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_VOLUNTEER_APPLICATIONS, 'default');
  revalidateTag(volunteerOpportunityTag(parsed.data.opportunityId), 'default');
  return { success: true, data: application };
  });
}

export async function updateVolunteerApplicationAction(
  id: string,
  input: UpdateVolunteerApplicationInput,
): Promise<ApiResponse<void>> {
  return runAction('updateVolunteerApplicationAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const application = await prisma.volunteerApplication.findUnique({
    where: { id },
    select: { volunteerId: true, opportunity: { select: { requesterId: true } } },
  });
  if (!application) {
    return { success: false, error: 'Not found' };
  }

  const parsed = updateVolunteerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  if (parsed.data.status && parsed.data.status !== 'CANCELLED') {
    if (auth.data.id !== application.opportunity.requesterId) {
      return { success: false, error: 'Only the requester can update application status' };
    }
  }

  if (parsed.data.status === 'CANCELLED' && auth.data.id !== application.volunteerId) {
    return { success: false, error: 'Only the volunteer can cancel their application' };
  }

  await prisma.volunteerApplication.update({
    where: { id },
    data: {
      ...parsed.data,
      respondedAt: parsed.data.status && ['ACCEPTED', 'DECLINED'].includes(parsed.data.status)
        ? new Date()
        : undefined,
      confirmedAt: parsed.data.status === 'CONFIRMED' ? new Date() : undefined,
      cancelledAt: parsed.data.status === 'CANCELLED' ? new Date() : undefined,
    },
  });

  revalidateTag(CACHE_TAG_VOLUNTEER_APPLICATIONS, 'default');
  return { success: true, data: undefined };
  });
}

export async function getMyVolunteerApplicationsAction(): Promise<ApiResponse<Array<{
  id: string;
  status: string;
  message: string | null;
  createdAt: Date;
  opportunity: {
    id: string;
    title: string;
    format: string;
    location: string | null;
    primaryRdgs: string[];
    requester: { id: string; name: string; organizationName: string | null };
  };
}>>> {
  return runAction('getMyVolunteerApplicationsAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const applications = await prisma.volunteerApplication.findMany({
    where: { volunteerId: auth.data.id },
    select: {
      id: true,
      status: true,
      message: true,
      createdAt: true,
      opportunity: {
        select: {
          id: true,
          title: true,
          format: true,
          location: true,
          primaryRdgs: true,
          requester: {
            select: { id: true, name: true, organizationName: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return { success: true, data: applications };
  });
}

// ─────────────────────────────────────────
// SAVED OPPORTUNITIES
// ─────────────────────────────────────────

export async function saveVolunteerOpportunityAction(id: string): Promise<ApiResponse<void>> {
  return runAction('saveVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  await prisma.savedVolunteerOpportunity.upsert({
    where: {
      userId_opportunityId: { userId: auth.data.id, opportunityId: id },
    },
    update: {},
    create: { userId: auth.data.id, opportunityId: id },
  });

  return { success: true, data: undefined };
  });
}

export async function unsaveVolunteerOpportunityAction(id: string): Promise<ApiResponse<void>> {
  return runAction('unsaveVolunteerOpportunityAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  await prisma.savedVolunteerOpportunity.delete({
    where: {
      userId_opportunityId: { userId: auth.data.id, opportunityId: id },
    },
  });

  return { success: true, data: undefined };
  });
}

export async function getSavedVolunteerOpportunitiesAction(): Promise<ApiResponse<Array<{
  id: string;
  createdAt: Date;
  opportunity: {
    id: string;
    title: string;
    summary: string;
    primaryRdgs: string[];
    format: string;
    location: string | null;
    rollingApplications: boolean;
    applicationDeadline: Date | null;
  };
}>>> {
  return runAction('getSavedVolunteerOpportunitiesAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const saved = await prisma.savedVolunteerOpportunity.findMany({
    where: { userId: auth.data.id },
    select: {
      id: true,
      createdAt: true,
      opportunity: {
        select: {
          id: true,
          title: true,
          summary: true,
          primaryRdgs: true,
          format: true,
          location: true,
          rollingApplications: true,
          applicationDeadline: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return { success: true, data: saved };
  });
}
