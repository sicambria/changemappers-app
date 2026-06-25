'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { withAvatarUrl } from '@/lib/entity-image';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { canModerateContent } from '@/lib/permissions';
import type {
  WeakSignal,
  WeakSignalFilters,
  ApiResponse,
} from '@/types/weak-signal';
import type {
  SignalDomain,
  SignalScale,
  SignalConfidence,
  SignalNovelty,
  VerificationLevel,
} from '@/lib/prisma';
import {
  createWeakSignalSchema,
  updateWeakSignalSchema,
} from '@/lib/validations/weak-signal';
import { findSimilarSignals } from '@/lib/weak-signal-similarity';
import { normalizeOffsetPagination, normalizeSearchText } from '@/lib/pagination';

function buildWeakSignalWhereClause(filters?: WeakSignalFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {
    deletedAt: null,
    status: { not: 'ARCHIVED' },
  };

  if (filters?.domain) where.domain = filters.domain;
  if (filters?.scale) where.scale = filters.scale;
  if (filters?.confidence) where.confidence = filters.confidence;
  if (filters?.novelty) where.novelty = filters.novelty;
  if (filters?.status) where.status = filters.status;
  if (filters?.patternId) where.patternId = filters.patternId;
  if (filters?.sourceType) where.sourceType = filters.sourceType;
  if (filters?.verificationLevel) where.verificationLevel = filters.verificationLevel;
  if (filters?.hasLocation) {
    where.isLocalizable = true;
    where.latitude = { not: null };
  }
  if (filters?.regenerativeRelevanceMin != null || filters?.regenerativeRelevanceMax != null) {
    const relevanceFilter: Record<string, number> = {};
    if (filters.regenerativeRelevanceMin != null) relevanceFilter.gte = filters.regenerativeRelevanceMin;
    if (filters.regenerativeRelevanceMax != null) relevanceFilter.lte = filters.regenerativeRelevanceMax;
    where.regenerativeRelevance = relevanceFilter;
  }

  const search = normalizeSearchText(filters?.search);
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { context: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  return where;
}

type WeakSignalUpdateInput = {
  title?: string;
  description?: string;
  context?: string | null;
  domain?: string;
  scale?: string;
  confidence?: string;
  novelty?: string;
  regenerativeRelevance?: number;
  sourceType?: string;
  sourceUrl?: string | null;
  isLocalizable?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  tags?: string[];
  communityId?: string | null;
  patternId?: string | null;
};

function applySignalCoreFields(updateData: Record<string, unknown>, v: WeakSignalUpdateInput): void {
  if (v.title !== undefined) updateData.title = v.title;
  if (v.description !== undefined) updateData.description = v.description;
  if (v.context !== undefined) updateData.context = v.context || null;
  if (v.domain !== undefined) updateData.domain = v.domain;
  if (v.scale !== undefined) updateData.scale = v.scale;
  if (v.confidence !== undefined) updateData.confidence = v.confidence;
  if (v.novelty !== undefined) updateData.novelty = v.novelty;
  if (v.regenerativeRelevance !== undefined) updateData.regenerativeRelevance = v.regenerativeRelevance;
  if (v.tags !== undefined) updateData.tags = v.tags;
}

function applySignalSourceFields(updateData: Record<string, unknown>, v: WeakSignalUpdateInput): void {
  if (v.sourceType !== undefined) updateData.sourceType = v.sourceType;
  if (v.sourceUrl !== undefined)
    updateData.sourceUrl = v.sourceUrl && v.sourceUrl !== '' ? v.sourceUrl : null;
}

function applySignalLocationFields(updateData: Record<string, unknown>, v: WeakSignalUpdateInput): void {
  if (v.isLocalizable !== undefined) updateData.isLocalizable = v.isLocalizable;
  if (v.latitude !== undefined) updateData.latitude = v.latitude;
  if (v.longitude !== undefined) updateData.longitude = v.longitude;
  if (v.locationName !== undefined) updateData.locationName = v.locationName || null;
}

function applySignalRelationFields(updateData: Record<string, unknown>, v: WeakSignalUpdateInput): void {
  if (v.communityId !== undefined) updateData.communityId = v.communityId || null;
  if (v.patternId !== undefined) updateData.patternId = v.patternId || null;
}

function buildWeakSignalUpdateData(validated: WeakSignalUpdateInput): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  applySignalCoreFields(updateData, validated);
  applySignalSourceFields(updateData, validated);
  applySignalLocationFields(updateData, validated);
  applySignalRelationFields(updateData, validated);
  return updateData;
}

function computeSignalCounts(signal: {
  _count?: { resonances?: number; corroborations?: number };
  resonances?: { vote: string }[];
}) {
  const resonanceCount = signal._count?.resonances ?? signal.resonances?.length ?? 0;
  const corroborationCount = signal._count?.corroborations ?? 0;
  const resonatesCount =
    signal.resonances?.filter((r: { vote: string }) => r.vote === 'RESONATES').length ?? 0;
  const doesntResonateCount =
    signal.resonances?.filter((r: { vote: string }) => r.vote === 'DOESNT_RESONATE').length ?? 0;
  return { resonanceCount, corroborationCount, resonatesCount, doesntResonateCount };
}

/**
 * Strip embedded base64 avatar bytes from a signal's user references, replacing
 * them with lazily-fetched entity-image URLs (2026-06-18 audit C1). A 50-row
 * signal list otherwise ships up to ~10 MB of inlined `createdBy.profilePhoto`
 * blobs; the detail view adds up to 20 more via resonance/corroboration users.
 */
function withSignalAvatarUrls<T extends Record<string, unknown>>(signal: T): T {
  const s = signal as T & {
    createdBy?: { id: string; profilePhoto?: string | null } | null;
    resonances?: Array<{ user?: { id: string; profilePhoto?: string | null } | null }>;
    corroborations?: Array<{ user?: { id: string; profilePhoto?: string | null } | null }>;
  };
  const mapped: Record<string, unknown> = { ...s };
  if (s.createdBy) mapped.createdBy = withAvatarUrl(s.createdBy);
  if (Array.isArray(s.resonances)) {
    mapped.resonances = s.resonances.map((r) => (r.user ? { ...r, user: withAvatarUrl(r.user) } : r));
  }
  if (Array.isArray(s.corroborations)) {
    mapped.corroborations = s.corroborations.map((c) => (c.user ? { ...c, user: withAvatarUrl(c.user) } : c));
  }
  return mapped as T;
}

export async function createWeakSignal(
  data: Record<string, unknown>
): Promise<ApiResponse<WeakSignal>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = createWeakSignalSchema.parse(data);

    if (validated.isLocalizable && (!validated.latitude || !validated.longitude)) {
      return { success: false, error: 'Location coordinates required for localizable signals' };
    }

    const signal = await prisma.weakSignal.create({
      data: {
        title: validated.title,
        description: validated.description,
        context: validated.context || null,
        domain: validated.domain as SignalDomain,
        scale: validated.scale as SignalScale,
        confidence: validated.confidence as SignalConfidence,
        novelty: validated.novelty as SignalNovelty,
        regenerativeRelevance: validated.regenerativeRelevance,
        sourceType: validated.sourceType as 'FIRSTHAND',
        sourceUrl: validated.sourceUrl && validated.sourceUrl !== '' ? validated.sourceUrl : null,
        isLocalizable: validated.isLocalizable,
        latitude: validated.latitude,
        longitude: validated.longitude,
        locationName: validated.locationName || null,
        tags: validated.tags || [],
        createdById: currentUser.data.user.id,
        communityId: validated.communityId || null,
        patternId: validated.patternId || null,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationLevel: 'SELF_DECLARED',
        moderationStatus: 'APPROVED',
      },
      include: {
        _count: { select: { resonances: true, corroborations: true } },
        resonances: { select: { vote: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
      },
    });

    revalidatePath('/signals');
    revalidatePath('/map');

    return {
      success: true,
      data: { ...signal, ...computeSignalCounts(signal) } as unknown as WeakSignal,
    };
  } catch (error: unknown) {
    logActionError('Error creating signal', error);
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: { path: string[]; message: string }[] };
      const errors: Record<string, string[]> = {};
      zodError.issues.forEach((issue) => {
        const key = issue.path.join('.') || 'form';
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      });
      return { success: false, errors };
    }
    return { success: false, error: 'Failed to create signal' };
  }
}

export async function getWeakSignals(
  filters?: WeakSignalFilters
): Promise<ApiResponse<WeakSignal[]>> {
  try {
    const where = buildWeakSignalWhereClause(filters);
    const { skip, take } = normalizeOffsetPagination(filters);

    const signals = await prisma.weakSignal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        _count: { select: { resonances: true, corroborations: true } },
        resonances: { select: { vote: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
      },
    });

    return {
      success: true,
      data: signals.map((s) => withSignalAvatarUrls({ ...s, ...computeSignalCounts(s) })) as unknown as WeakSignal[],
    };
  } catch (error: unknown) {
    logActionError('Error fetching signals', error);
    return { success: false, error: 'Failed to fetch signals' };
  }
}

export async function getWeakSignalById(id: string): Promise<ApiResponse<WeakSignal>> {
  try {
    const signal = await prisma.weakSignal.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        context: true,
        domain: true,
        scale: true,
        confidence: true,
        novelty: true,
        regenerativeRelevance: true,
        sourceType: true,
        sourceUrl: true,
        isLocalizable: true,
        latitude: true,
        longitude: true,
        locationName: true,
        tags: true,
        status: true,
        visibility: true,
        verificationLevel: true,
        moderationStatus: true,
        createdById: true,
        communityId: true,
        patternId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: { select: { resonances: true, corroborations: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        community: { select: { id: true, name: true } },
        pattern: { select: { id: true, name: true } },
        resonances: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
          },
        },
        corroborations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
          },
        },
      },
    });

    if (!signal) {
      return { success: false, error: 'Signal not found' };
    }

    const resonatesCount =
      signal.resonances?.filter((r: { vote: string }) => r.vote === 'RESONATES').length ?? 0;
    const doesntResonateCount =
      signal.resonances?.filter((r: { vote: string }) => r.vote === 'DOESNT_RESONATE').length ??
      0;

    return {
      success: true,
      data: withSignalAvatarUrls({
        ...signal,
        resonanceCount: signal._count.resonances,
        corroborationCount: signal._count.corroborations,
        resonatesCount,
        doesntResonateCount,
      }) as unknown as WeakSignal,
    };
  } catch (error: unknown) {
    logActionError('Error fetching signal', error);
    return { success: false, error: 'Failed to fetch signal' };
  }
}

export async function updateWeakSignal(
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse<WeakSignal>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const existing = await prisma.weakSignal.findUnique({
      where: { id },
      select: { createdById: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    if (existing.createdById !== currentUser.data.user.id) {
      return { success: false, error: 'Not authorized to edit this signal' };
    }

    const validated = updateWeakSignalSchema.parse({ ...data, id });

    if (validated.isLocalizable && (!validated.latitude || !validated.longitude)) {
      return { success: false, error: 'Location coordinates required for localizable signals' };
    }

    const updateData = buildWeakSignalUpdateData(validated);

    const signal = await prisma.weakSignal.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { resonances: true, corroborations: true } },
        resonances: { select: { vote: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
      },
    });

    revalidatePath('/signals');
    revalidatePath(`/signals/${id}`);
    revalidatePath('/map');

    return {
      success: true,
      data: { ...signal, ...computeSignalCounts(signal) } as unknown as WeakSignal,
    };
  } catch (error: unknown) {
    logActionError('Error updating signal', error);
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: { path: string[]; message: string }[] };
      const errors: Record<string, string[]> = {};
      zodError.issues.forEach((issue) => {
        const key = issue.path.join('.') || 'form';
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      });
      return { success: false, errors };
    }
    return { success: false, error: 'Failed to update signal' };
  }
}

export async function deleteWeakSignal(id: string): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!signal) {
      return { success: false, error: 'Signal not found' };
    }

    if (signal.createdById !== currentUser.data.user.id) {
      return { success: false, error: 'Not authorized to delete this signal' };
    }

    await prisma.weakSignal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/signals');
    revalidatePath('/map');

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error deleting signal', error);
    return { success: false, error: 'Failed to delete signal' };
  }
}

export async function resonateWithSignal(
  signalId: string,
  vote: 'RESONATES' | 'DOESNT_RESONATE',
  note?: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = currentUser.data.user.id;

    await prisma.$transaction(async (tx) => {
      await tx.signalResonanceVote.upsert({
        where: { signalId_userId: { signalId, userId } },
        create: { signalId, userId, vote, note: note || null },
        update: { vote, note: note || null },
      });

      const resonatesCount = await tx.signalResonanceVote.count({
        where: { signalId, vote: 'RESONATES' },
      });

      let newVerificationLevel: VerificationLevel = 'SELF_DECLARED';
      if (resonatesCount >= 10) newVerificationLevel = 'COMMUNITY_VERIFIED';
      else if (resonatesCount >= 3) newVerificationLevel = 'PEER_VOUCHED';

      await tx.weakSignal.update({
        where: { id: signalId },
        data: { verificationLevel: newVerificationLevel },
      });
    });

    revalidatePath('/signals');
    revalidatePath(`/signals/${signalId}`);
    revalidatePath('/map');

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error resonating with signal', error);
    return { success: false, error: 'Failed to record resonance' };
  }
}

export async function corroborateSignal(
  signalId: string,
  evidence: string,
  sourceUrl?: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = currentUser.data.user.id;

    if (!evidence || evidence.trim().length < 10) {
      return { success: false, error: 'Evidence must be at least 10 characters' };
    }

    await prisma.signalCorroboration.upsert({
      where: { signalId_userId: { signalId, userId } },
      create: {
        signalId,
        userId,
        evidence: evidence.trim(),
        sourceUrl: sourceUrl || null,
      },
      update: {
        evidence: evidence.trim(),
        sourceUrl: sourceUrl || null,
      },
    });

    revalidatePath('/signals');
    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error corroborating signal', error);
    return { success: false, error: 'Failed to add corroboration' };
  }
}

export async function getSimilarSignals(
  signalId: string,
  limit = 6
): Promise<ApiResponse<WeakSignal[]>> {
  try {
    const source = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      include: {
        _count: { select: { resonances: true, corroborations: true } },
        resonances: { select: { vote: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
      },
    });

    if (!source || source.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const candidates = await prisma.weakSignal.findMany({
      where: {
        deletedAt: null,
        status: { not: 'ARCHIVED' },
        id: { not: signalId },
      },
      take: 100,
      include: {
        _count: { select: { resonances: true, corroborations: true } },
        resonances: { select: { vote: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
      },
    });

    const sourceSignal = { ...source, ...computeSignalCounts(source) } as unknown as WeakSignal;
    const candidateSignals = candidates.map((c) => withSignalAvatarUrls({ ...c, ...computeSignalCounts(c) })) as unknown as WeakSignal[];

    const similar = findSimilarSignals(sourceSignal, candidateSignals, limit);

    return {
      success: true,
      data: similar.map((r) => r.signal),
    };
  } catch (error: unknown) {
    logActionError('Error fetching similar signals', error);
    return { success: false, error: 'Failed to fetch similar signals' };
  }
}

export async function getWeakSignalsTimeline(
  filters?: WeakSignalFilters
): Promise<ApiResponse<WeakSignal[]>> {
  try {
    const where: Record<string, unknown> = {
      deletedAt: null,
      status: { not: 'ARCHIVED' },
    };

    if (filters?.domain) where.domain = filters.domain;
    if (filters?.scale) where.scale = filters.scale;
    if (filters?.confidence) where.confidence = filters.confidence;
    if (filters?.novelty) where.novelty = filters.novelty;

    const { skip, take } = normalizeOffsetPagination(filters);

    const signals = await prisma.weakSignal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        _count: { select: { resonances: true, corroborations: true } },
        resonances: { select: { vote: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
      },
    });

    return {
      success: true,
      data: signals.map((s) => withSignalAvatarUrls({ ...s, ...computeSignalCounts(s) })) as unknown as WeakSignal[],
    };
  } catch (error: unknown) {
    logActionError('Error fetching timeline', error);
    return { success: false, error: 'Failed to fetch timeline' };
  }
}

export async function flagSignalNoise(
  signalId: string,
  reason: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: 'Reason must be at least 10 characters' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { id: true, deletedAt: true, createdById: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (signal.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to moderate this signal' };
    }

    await prisma.weakSignal.update({
      where: { id: signalId },
      data: { moderationStatus: 'PENDING_REVIEW' },
    });

    revalidatePath('/signals');
    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error flagging signal', error);
    return { success: false, error: 'Failed to flag signal' };
  }
}
