'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { z } from 'zod';
import { prisma, ProfileType, CommunityType, EventType, ConnectionStatus, ModerationStatus, EventStatus } from '@/lib/prisma';
import type { Prisma } from '@/lib/prisma';
import {
  adminHardDeleteUser,
  buildUserContentWipeOperations,
  foreignKeyConstraintName,
  isForeignKeyConstraintViolation,
} from '@/lib/gdpr/admin-user-deletion';
import { getCurrentUser } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

export interface AdminListFilters {
  search?: string;
  status?: string;
  type?: string;
  includeArchived?: boolean;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  filters?: AdminListFilters;
}

// Strict schemas — no .passthrough(). Only safe-to-import fields are allowed.
// Security-sensitive columns (isAdmin, passwordHash, isSuspended, tokens) are
// intentionally excluded to prevent privilege escalation via crafted payloads.
const UserImportSchema = z.object({
  id: z.string().optional(),
  email: z.email().optional(),
  name: z.string().max(255).optional(),
  displayName: z.string().max(255).optional(),
  profileType: z.enum(['GUEST', 'CHANGEMAKER', 'ADMIN']).optional(),
});

const CommunityImportSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
});

const EventImportSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(255).optional(),
  type: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).optional(),
  description: z.string().max(5000).optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

const SocialCauseImportSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
});

const ConnectionImportSchema = z.object({
  id: z.string().optional(),
  senderId: z.string().optional(),
  receiverId: z.string().optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).optional(),
});

const DbImportSchema = z.object({
  version: z.string(),
  exportDate: z.iso.datetime().optional(),
  data: z.object({
    users: z.array(UserImportSchema).optional(),
    communities: z.array(CommunityImportSchema).optional(),
    events: z.array(EventImportSchema).optional(),
    socialCauses: z.array(SocialCauseImportSchema).optional(),
    connections: z.array(ConnectionImportSchema).optional(),
    communityMembers: z.array(z.record(z.string(), z.unknown())).optional(),
    eventRsvps: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
});

interface AdminUserUpdate { profileType?: string; name?: string; email?: string; isSuspended?: boolean; isModerator?: boolean; }
interface AdminCommunityUpdate { name?: string; }
interface AdminEventUpdate { title?: string; type?: string; }
interface AdminCreateData { name?: string; email?: string; profileType?: string; description?: string; title?: string; type?: string; }
interface AdminImportItem { id?: string; [key: string]: unknown; }

// Reusable permission check
async function assertAdmin() {
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data?.user) {
        logger.warn({ msg: 'assertAdmin failed: no authenticated user' });
    throw new Error('Not authenticated');
  }
  if (!userResult.data.user.isAdmin) {
    logger.warn({ msg: 'assertAdmin failed: insufficient privileges' });
    throw new Error('Unauthorized access');
    }
    return userResult.data.user;
}

// ----------------------------------------------------
// GET Actions (Paginated)
// ----------------------------------------------------

export interface PaginatedResponse<T> {
    success: boolean;
    data?: T[];
    totalCount?: number;
    totalPages?: number;
    error?: string;
}

export async function adminGetUsers(page = 1, pageSize = 50, filters?: AdminListFilters): Promise<PaginatedResponse<Record<string, unknown>>> {
  try {
    await assertAdmin();
    const skip = Math.max(0, (page - 1) * pageSize);

    const where: Prisma.UserWhereInput = {};
    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters?.type) {
      where.profileType = filters.type as ProfileType;
    }
    if (filters?.status === 'suspended') {
      where.isSuspended = true;
    } else if (filters?.status === 'active') {
      where.isSuspended = false;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true, name: true, email: true, profileType: true,
          createdAt: true, isSuspended: true, isModerator: true, displayName: true,
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      success: true,
      data: users,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (e: unknown) {
    logActionError('Admin get users error', e);
    return { success: false, error: 'Operation failed.' };
  }
}

export async function adminGetCommunities(page = 1, pageSize = 50, filters?: AdminListFilters): Promise<PaginatedResponse<Record<string, unknown>>> {
  try {
    await assertAdmin();
    const skip = Math.max(0, (page - 1) * pageSize);

    const where: Prisma.CommunityWhereInput = {};
    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters?.type) {
      where.type = filters.type as CommunityType;
    }
    if (filters?.status === 'hidden') {
      where.moderationStatus = 'HIDDEN' as ModerationStatus;
    } else if (filters?.status === 'pending') {
      where.moderationStatus = 'PENDING_REVIEW' as ModerationStatus;
    } else if (filters?.status === 'approved') {
      where.moderationStatus = 'APPROVED' as ModerationStatus;
    }
    if (filters?.includeArchived !== true) {
      where.deletedAt = null;
    }

    const [communities, totalCount] = await Promise.all([
      prisma.community.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, name: true, createdAt: true, deletedAt: true, type: true, moderationStatus: true, city: true }
      }),
      prisma.community.count({ where })
    ]);

    return {
      success: true,
      data: communities,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function adminGetEvents(page = 1, pageSize = 50, filters?: AdminListFilters): Promise<PaginatedResponse<Record<string, unknown>>> {
  try {
    await assertAdmin();
    const skip = Math.max(0, (page - 1) * pageSize);

    const where: Prisma.EventWhereInput = {};
  if (filters?.search) {
    const q = filters.search;
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
    ];
  }
    if (filters?.type) {
      where.type = filters.type as EventType;
    }
    if (filters?.status) {
      where.status = filters.status as EventStatus;
    }
    if (filters?.includeArchived !== true) {
      where.deletedAt = null;
    }

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, title: true, type: true, createdAt: true, deletedAt: true, status: true, location: true }
      }),
      prisma.event.count({ where })
    ]);

    return {
      success: true,
      data: events,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ----------------------------------------------------
// UPDATE Actions
// ----------------------------------------------------

export async function adminUpdateUser(id: string, data: AdminUserUpdate) {
  try {
    await assertAdmin();
    await prisma.user.update({
      where: { id },
      data: {
        profileType: data.profileType ? (data.profileType as ProfileType) : undefined,
        name: data.name,
        email: data.email,
        isSuspended: data.isSuspended,
        isModerator: data.isModerator,
      }
    });
    return { success: true, message: 'User updated.' };
  } catch (e: unknown) {
    logActionError('Admin update user error', e);
    return { success: false, error: 'Update failed.' };
  }
}

export async function adminUpdateCommunity(id: string, data: AdminCommunityUpdate) {
  try {
    await assertAdmin();
    await prisma.community.update({
      where: { id },
      data: {
        name: data.name,
      }
    });
    return { success: true, message: 'Community updated.' };
  } catch (e: unknown) {
    logActionError('Admin update community error', e);
    return { success: false, error: 'Update failed.' };
  }
}

export async function adminUpdateEvent(id: string, data: AdminEventUpdate) {
  try {
    await assertAdmin();
    await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type ? (data.type as EventType) : undefined,
      }
    });
    return { success: true, message: 'Event updated.' };
  } catch (e: unknown) {
    logActionError('Admin update event error', e);
    return { success: false, error: 'Update failed.' };
  }
}

type AdminDataType = 'USER' | 'COMMUNITY' | 'EVENT';

export async function adminExportData(type: AdminDataType) {
  try {
    await assertAdmin();
    let data: unknown[] = [];
  if (type === 'USER') {
    data = await prisma.user.findMany({
    select: { id: true, name: true, email: true, profileType: true, createdAt: true, isSuspended: true, displayName: true, profilePhoto: true },
    take: 5000,
    });
  } else if (type === 'COMMUNITY') {
    data = await prisma.community.findMany({
    select: { id: true, name: true, description: true, type: true, city: true, country: true, createdAt: true, ownerId: true },
    take: 5000,
    });
  } else if (type === 'EVENT') {
    data = await prisma.event.findMany({
    select: { id: true, title: true, type: true, description: true, startDate: true, endDate: true, createdAt: true, hostId: true },
    take: 5000,
    });
  }
    return { success: true, data };
  } catch (e: unknown) {
    logActionError('Admin export error', e);
    return { success: false, error: 'Export failed.' };
  }
}

// ----------------------------------------------------
// IMPORT Actions
// ----------------------------------------------------

// Applies a single validated import row as an update. Extracted from the loop so the
// per-type branching stays shallow (see clean-code max-depth guard). Throws on failure;
// the caller isolates and logs per-row errors.
async function applyAdminImportUpdate(
  type: AdminDataType,
  id: string,
  item: AdminImportItem,
): Promise<void> {
  if (type === 'USER') {
    const { id: _id, ...rest } = item;
    await prisma.user.update({ where: { id }, data: rest as Parameters<typeof prisma.user.update>[0]['data'] });
  } else if (type === 'COMMUNITY') {
    const { id: _id, ...rest } = item;
    await prisma.community.update({ where: { id }, data: rest as Parameters<typeof prisma.community.update>[0]['data'] });
  } else {
    const { id: _id, ...rest } = item as { id: string; startDate?: string; endDate?: string; [key: string]: unknown };
    // Dates arrive as strings and must be converted before write.
    const eventData: Record<string, unknown> = { ...rest };
    if (eventData.startDate) eventData.startDate = new Date(eventData.startDate as string);
    if (eventData.endDate) eventData.endDate = new Date(eventData.endDate as string);
    await prisma.event.update({ where: { id }, data: eventData as Parameters<typeof prisma.event.update>[0]['data'] });
  }
}

export async function adminImportData(type: AdminDataType, importedRaw: AdminImportItem[]) {
try {
await assertAdmin();

// Validate input data with Zod to prevent injection attacks
const validatedItems = importedRaw.map(item => {
if (type === 'USER') return UserImportSchema.parse(item);
if (type === 'COMMUNITY') return CommunityImportSchema.parse(item);
if (type === 'EVENT') return EventImportSchema.parse(item);
return item;
});

let imported = 0;
let errors = 0;

for (const item of validatedItems) {
            // Only existing records (with an id) are updated; new-record creation is not supported here.
            if (!item.id) continue;
            const id = item.id;

            try {
                await applyAdminImportUpdate(type, id, item as AdminImportItem);
                imported++;
            } catch (e) {
                logActionError(`Import ${type.toLowerCase()} error`, e, { id });
                errors++;
            }
        }

  revalidatePath('/admin');
  return { success: true, message: `Imported: ${imported}, Errors: ${errors}` };
  } catch (e: unknown) {
    logActionError('Admin import data error', e);
    return { success: false, error: 'Import failed.' };
  }
}

// ----------------------------------------------------
// CREATE Actions
// ----------------------------------------------------
export async function adminCreateData(type: AdminDataType, data: AdminCreateData) {
  try {
    await assertAdmin();

    let created;
    if (type === 'USER') {
      created = await prisma.user.create({
        data: {
          name: data.name || 'New User',
          email: data.email || `new_${Date.now()}@example.com`,
          profileType: (data.profileType || 'GUEST') as ProfileType,
          passwordHash: null,
        }
      });
    } else if (type === 'COMMUNITY') {
      const user = await getCurrentUser();
      if (!user.data?.user?.id) throw new Error('Admin user not found');
      created = await prisma.community.create({
        data: {
          name: data.name || 'New Community',
          description: data.description || '',
          ownerId: user.data.user.id,
        }
      });
    } else if (type === 'EVENT') {
      const user = await getCurrentUser();
      if (!user.data?.user?.id) throw new Error('Admin user not found');
      created = await prisma.event.create({
        data: {
          title: data.title || 'New Event',
          type: (data.type || 'ONLINE') as EventType,
          description: data.description || '',
          startDate: new Date(),
          endDate: new Date(Date.now() + 3600000),
          hostId: user.data.user.id,
        }
      });
    }

    revalidatePath('/admin');
    return { success: true, message: 'Created successfully.', data: created };
  } catch (e: unknown) {
    logActionError('Admin create error', e);
    return { success: false, error: 'Create failed.' };
  }
}

// ----------------------------------------------------
// DELETE Actions (Single & Bulk)
// ----------------------------------------------------
export async function adminDeleteData(type: AdminDataType, ids: string[]) {
  try {
    const admin = await assertAdmin();

    if (type === 'USER') {
      // AUDIT-20260613-028: route admin user deletion through the shared GDPR
      // erasure machinery. A bare `user.deleteMany` fails with an FK violation
      // for any content-bearing account (~34 User relations default to
      // onDelete: Restrict). The helper erases personal data first and then
      // removes the User row where nothing blocks it; accounts with retained
      // anonymized content stay as anonymized tombstones.
      const users = await prisma.user.findMany({
        where: { id: { in: ids, not: admin.id } },
        select: { id: true },
      });
      let deleted = 0;
      let anonymized = 0;
      for (const user of users) {
        const outcome = await adminHardDeleteUser(prisma, user.id);
        if (outcome === 'deleted') deleted += 1;
        else anonymized += 1;
      }

      revalidatePath('/admin');
      const message = anonymized > 0
        ? await localizeActionMessage('admin.manage.usersDeletedWithAnonymized', {
            total: deleted + anonymized,
            deleted,
            anonymized,
          })
        : await localizeActionMessage('admin.manage.usersDeleted', { count: deleted });
      return { success: true, message };
    }

    let result;
    if (type === 'COMMUNITY') {
      result = await prisma.community.deleteMany({ where: { id: { in: ids } } });
    } else if (type === 'EVENT') {
      result = await prisma.event.deleteMany({ where: { id: { in: ids } } });
    } else {
      return { success: false, error: `Unknown type: ${type}` };
    }

    revalidatePath('/admin');
    return { success: true, message: `${result.count} item(s) deleted.` };
  } catch (e: unknown) {
    logActionError('Admin delete error', e, { type, ids });
    // Surface the real cause instead of a generic "Delete failed." when the
    // database blocked the delete via a foreign key constraint.
    if (isForeignKeyConstraintViolation(e)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.manage.deleteBlockedByLinkedRecords', {
          constraint: foreignKeyConstraintName(e) ?? 'foreign key',
        }),
      };
    }
    return { success: false, error: await localizeActionMessage('admin.manage.deleteFailed') };
  }
}

// ----------------------------------------------------
// FULL DATABASE EXPORT
// ----------------------------------------------------
export async function adminExportFullDb() {
    try {
        await assertAdmin();

  const [users, communities, events, connections, communityMembers, eventRsvps, socialCauses] = await Promise.all([
    prisma.user.findMany({
    select: { id: true, name: true, email: true, profileType: true, createdAt: true, isSuspended: true, displayName: true, profilePhoto: true },
    take: 5000,
    }),
    prisma.community.findMany({
    select: { id: true, name: true, description: true, type: true, city: true, country: true, createdAt: true, ownerId: true },
    take: 5000,
    }),
    prisma.event.findMany({
    select: { id: true, title: true, type: true, description: true, startDate: true, endDate: true, createdAt: true, hostId: true },
    take: 5000,
    }),
    prisma.connection.findMany({
    select: { id: true, senderId: true, receiverId: true, status: true, createdAt: true },
    take: 5000,
    }),
    prisma.communityMember.findMany({
    select: { id: true, communityId: true, userId: true, role: true, status: true, joinedAt: true },
    take: 5000,
    }),
    prisma.eventRsvp.findMany({
    select: { id: true, eventId: true, userId: true, status: true, createdAt: true },
    take: 5000,
    }),
    prisma.socialCause.findMany({
    select: { id: true, title: true, description: true, createdAt: true },
    take: 5000,
    })
  ]);

        const fullDb = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            data: {
                users,
                communities,
                events,
                connections,
                communityMembers,
                eventRsvps,
                socialCauses
            }
        };

return { success: true, data: fullDb };
  } catch (e: unknown) {
    logActionError('Full DB Export error', e);
    return { success: false, error: 'Export failed.' };
  }
}

// ----------------------------------------------------
// FULL DATABASE IMPORT (Transaction) — per-entity helpers
// ----------------------------------------------------

// Users — only safe fields; security-sensitive columns are never written here
async function importTxUsers(
  tx: Prisma.TransactionClient,
  users: NonNullable<z.infer<typeof DbImportSchema>['data']['users']>,
): Promise<void> {
  for (const user of users) {
    if (!user.id) continue;
    const safeUpdate = {
      ...(user.email !== undefined && { email: user.email }),
      ...(user.name !== undefined && { name: user.name }),
      ...(user.displayName !== undefined && { displayName: user.displayName }),
      ...(user.profileType !== undefined && { profileType: user.profileType as ProfileType }),
    };
    await tx.user.upsert({
      where: { id: user.id },
      update: safeUpdate,
      create: {
        id: user.id,
        name: user.name ?? 'Imported User',
        email: user.email ?? `imported_${user.id}@example.com`,
        profileType: (user.profileType ?? 'GUEST') as ProfileType,
        displayName: user.displayName,
      },
    });
  }
}

async function importTxCommunities(
  tx: Prisma.TransactionClient,
  communities: NonNullable<z.infer<typeof DbImportSchema>['data']['communities']>,
): Promise<void> {
  for (const comm of communities) {
    if (!comm.id) continue;
    const safeUpdate = {
      ...(comm.name !== undefined && { name: comm.name }),
      ...(comm.description !== undefined && { description: comm.description }),
    };
    await tx.community.updateMany({ where: { id: comm.id }, data: safeUpdate });
  }
}

async function importTxEvents(
  tx: Prisma.TransactionClient,
  events: NonNullable<z.infer<typeof DbImportSchema>['data']['events']>,
): Promise<void> {
  for (const ev of events) {
    if (!ev.id) continue;
    const startDate = ev.startDate ? new Date(ev.startDate) : undefined;
    const endDate = ev.endDate ? new Date(ev.endDate) : undefined;
    const safeUpdate = {
      ...(ev.title !== undefined && { title: ev.title }),
      ...(ev.type !== undefined && { type: ev.type as EventType }),
      ...(ev.description !== undefined && { description: ev.description }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
    };
    await tx.event.updateMany({ where: { id: ev.id }, data: safeUpdate });
  }
}

async function importTxSocialCauses(
  tx: Prisma.TransactionClient,
  socialCauses: NonNullable<z.infer<typeof DbImportSchema>['data']['socialCauses']>,
): Promise<void> {
  for (const cause of socialCauses) {
    if (!cause.id) continue;
    const safeUpdate = {
      ...(cause.description !== undefined && { description: cause.description }),
    };
    await tx.socialCause.updateMany({ where: { id: cause.id }, data: safeUpdate });
  }
}

async function importTxConnections(
  tx: Prisma.TransactionClient,
  connections: NonNullable<z.infer<typeof DbImportSchema>['data']['connections']>,
): Promise<void> {
  const safeConnections = connections
    .filter((c) => c.senderId && c.receiverId)
    .map((c) => ({
      ...(c.id && { id: c.id }),
      senderId: c.senderId!,
      receiverId: c.receiverId!,
      status: (c.status ?? 'PENDING') as ConnectionStatus,
    }));
  if (safeConnections.length) {
    await tx.connection.createMany({ data: safeConnections, skipDuplicates: true });
  }
}

export async function adminImportFullDb(fullDbStr: string) {
  try {
    await assertAdmin();

    let parsed: unknown;
    try {
      parsed = JSON.parse(fullDbStr);
    } catch {
      return { success: false, error: 'Invalid JSON format.' };
    }

    const validationResult = DbImportSchema.safeParse(parsed);
    if (!validationResult.success) {
      logActionError('DB Import validation error', validationResult.error, { issues: z.flattenError(validationResult.error) });
      const firstError = validationResult.error.issues[0];
      return { success: false, error: `Invalid database export format: ${firstError?.path.join('.') || ''} ${firstError?.message || 'Unknown error'}` };
    }

    const data = validationResult.data.data;

    await prisma.$transaction(async (tx) => {
      // 1. Users — only safe fields; security-sensitive columns are never written here
      if (data.users?.length) await importTxUsers(tx, data.users);
      // 2. Communities
      if (data.communities?.length) await importTxCommunities(tx, data.communities);
      // 3. Events
      if (data.events?.length) await importTxEvents(tx, data.events);
      // 4. Social Causes
      if (data.socialCauses?.length) await importTxSocialCauses(tx, data.socialCauses);
      // 5. Relationship tables — only safe, validated fields from strict schemas
      if (data.connections?.length) await importTxConnections(tx, data.connections);
    });

  revalidatePath('/admin');
  return { success: true, message: 'Full database synchronized successfully.' };
  } catch (e: unknown) {
    logActionError('Full DB Import error', e);
    return { success: false, error: 'Database import failed.' };
  }
}

// ----------------------------------------------------
// FULL DATABASE RESET (Wipe)
// ----------------------------------------------------
export async function adminResetFullDb() {
  try {
    const currentUser = await assertAdmin();

    await prisma.$transaction([
      prisma.eventRsvp.deleteMany(),
      prisma.communityMember.deleteMany(),
      prisma.connection.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.appreciate.deleteMany(),
      prisma.message.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.userInterest.deleteMany(),
      prisma.userValue.deleteMany(),
      prisma.userSkill.deleteMany(),
      // AUDIT-20260613-028: wipe every model that blocks hard-deleting User /
      // Event / Community / SocialCause rows via Restrict-default relations
      // (FK-safe order; includes report/pageVisitLog/feedPost/story/...).
      ...buildUserContentWipeOperations(prisma),
      prisma.event.deleteMany(),
      prisma.community.deleteMany(),
      prisma.socialCause.deleteMany(),
      prisma.user.deleteMany({
        where: {
          id: { not: currentUser.id }
        }
      })
    ]);

    revalidatePath('/admin');
    return { success: true, message: 'Database deleted successfully (except your own admin account).' };
  } catch (e: unknown) {
    logActionError('Full DB Reset error', e);
    if (isForeignKeyConstraintViolation(e)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.manage.deleteBlockedByLinkedRecords', {
          constraint: foreignKeyConstraintName(e) ?? 'foreign key',
        }),
      };
    }
    return { success: false, error: 'Database deletion failed.' };
  }
}
