'use server';

import { logActionError } from '@/lib/action-logger';
import { isDynamicServerUsageError } from '@/lib/server-action-errors';
import { localizeActionMessage, localizeActionZodError } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { AuditAction, EventRole, EventStatus, RsvpStatus } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAG_EVENTS } from '@/lib/cache-tags';
import { canEditEvent, canManageCommunityEvents } from '@/lib/permissions';

import type { ApiResponse } from '@/types/common';


type EventPersonProjection = { id: string; name: string; displayName: string | null; profilePhoto: string | null };
type EventCommunityProjection = { id: string; name: string; city?: string | null; coverImage?: string | null } | null;

type EventRdgProjection = { id: string; key?: string | null; label: string; labelHu?: string | null; category?: string | null };
type EventListRow = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  isOnline: boolean;
  onlineLink: string | null;
  capacity: number | null;
  category: string;
  type: string;
  coverImage: string | null;
  status: string;
  User_Event_hostIdToUser: EventPersonProjection;
  Community: EventCommunityProjection;
  socialCauses: Array<{ socialCause: unknown }>;
  rdgTags: Array<{ RegenerativeGoal: EventRdgProjection }>;
  _count: { EventRsvp: number };
};
type EventDetailRow = EventListRow & {
  organizers: unknown[];
  EventRsvp: unknown[];
};

function mapEventRdg(goal: EventRdgProjection) {
  return { id: goal.id, key: goal.key ?? goal.id, title: goal.label, label: goal.label, labelHu: goal.labelHu ?? null, category: goal.category ?? null };
}

const blankStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim().length === 0) {
    return undefined;
  }
  return value;
};

const optionalRelationIdSchema = z.preprocess(
  blankStringToUndefined,
  z.string().trim().min(1).nullable().optional(),
);

const relationIdArraySchema = (max: number) => z.preprocess(
  (value) => Array.isArray(value) ? value.filter((item) => !(typeof item === 'string' && item.trim().length === 0)) : value,
  z.array(z.string().trim().min(1)).max(max).optional(),
);

// Validation Schemas
const createEventSchema = z.object({
    title: z.string().min(3, 'event.validation.titleMin').max(100),
    description: z.string().max(2000).optional(),
    startDateTime: z.date().or(z.string().transform(val => new Date(val))),
    endDateTime: z.date().or(z.string().transform(val => new Date(val))).optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isOnline: z.boolean().default(false),
    onlineLink: z.url().optional().or(z.literal('')),
    isPublic: z.boolean().default(true),
    maxAttendees: z.number().int().positive().optional(),
    category: z.enum(['WORKSHOP', 'MEETUP', 'CELEBRATION', 'OPEN_SPACE', 'WORKDAY', 'OPEN_DAY', 'TRAINING', 'RETREAT', 'OTHER']).default('MEETUP'),
    communityId: optionalRelationIdSchema,
    causeIds: relationIdArraySchema(20),
    rdgIds: relationIdArraySchema(30),
});

const eventFilterSchema = z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    type: z.enum(['PUBLIC', 'COMMUNITY', 'PRIVATE']).optional(),
    category: z.enum(['WORKSHOP', 'MEETUP', 'CELEBRATION', 'OPEN_SPACE', 'WORKDAY', 'OPEN_DAY', 'TRAINING', 'RETREAT', 'OTHER']).optional(),
    search: z.string().optional(),
    location: z.string().optional(),
    causeId: z.string().optional(),
    rdgId: z.string().optional(),
    timeFilter: z.enum(['THIS_WEEK', 'THIS_MONTH', 'NEXT_MONTH', 'PAST']).optional(),
});

function applyTimeFilter(where: Record<string, unknown>, timeFilter: string): void {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfFollowingMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);

    if (timeFilter === 'THIS_WEEK') where.startDate = { gte: startOfWeek, lt: endOfWeek };
    else if (timeFilter === 'THIS_MONTH') where.startDate = { gte: startOfMonth, lt: startOfNextMonth };
    else if (timeFilter === 'NEXT_MONTH') where.startDate = { gte: startOfNextMonth, lt: startOfFollowingMonth };
    else if (timeFilter === 'PAST') {
        where.startDate = { lt: now };
        delete where.status;
    }
}

function buildEventWhereClause(filter?: z.infer<typeof eventFilterSchema>): Record<string, unknown> {
    const where: Record<string, unknown> = {
        deletedAt: null,
        moderationStatus: 'APPROVED',
        status: { in: ['UPCOMING', 'ONGOING'] },
        type: 'PUBLIC',
    };

    if (!filter) return where;

    const validated = eventFilterSchema.parse(filter);
    if (validated.startDate) where.startDate = { gte: validated.startDate };
    if (validated.endDate) where.startDate = { ...(where.startDate as Record<string, Date> | undefined), lte: validated.endDate };
    if (validated.timeFilter) applyTimeFilter(where, validated.timeFilter);
    if (validated.type) where.type = validated.type;
    if (validated.category) where.category = validated.category;
    if (validated.location) where.location = { contains: validated.location.trim(), mode: 'insensitive' };
    if (validated.causeId) where.socialCauses = { some: { causeId: validated.causeId } };
    if (validated.rdgId) where.rdgTags = { some: { rdgId: validated.rdgId } };
    if (validated.search) {
        where.OR = [
            { title: { contains: validated.search, mode: 'insensitive' } },
            { description: { contains: validated.search, mode: 'insensitive' } },
        ];
    }
    return where;
}

export async function getEvents(filter?: z.infer<typeof eventFilterSchema>) {
    const where = buildEventWhereClause(filter);

	const events = await prisma.event.findMany({
	  where,
	  orderBy: { startDate: 'asc' },
	  take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        isOnline: true,
        onlineLink: true,
        capacity: true,
        category: true,
        type: true,
        coverImage: true,
        status: true,
        Community: {
          select: {
            id: true,
            name: true,
            city: true,
            coverImage: true
          }
        },
        socialCauses: {
          select: {
            socialCause: {
              select: { id: true, slug: true, title: true }
            }
          },
          take: 8
        },
        rdgTags: {
          select: {
            RegenerativeGoal: {
              select: { id: true, key: true, label: true, labelHu: true, category: true }
            }
          },
          take: 8
        },
        User_Event_hostIdToUser: {
          select: {
            id: true,
            name: true,
            displayName: true,
            profilePhoto: true
          }
        },
        _count: {
          select: { EventRsvp: true }
        }
      }
    }) as EventListRow[];

    return events.map((event) => ({
      ...event,
      host: event.User_Event_hostIdToUser,
      community: event.Community,
      causes: event.socialCauses.map((link) => link.socialCause),
      rdgTags: event.rdgTags.map((link) => mapEventRdg(link.RegenerativeGoal)),
      _count: {
        rsvps: event._count.EventRsvp,
      },
    }));
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createEventAction(userId: string, data: z.infer<typeof createEventSchema>): Promise<ApiResponse<any>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        const validated = createEventSchema.parse(data);

        if (validated.communityId) {
            const canPostForCommunity = await canManageCommunityEvents(currentUser.data.user, validated.communityId);
            if (!canPostForCommunity) {
                return { success: false, error: await localizeActionMessage('common.forbidden') };
            }
        }

        const event = await prisma.$transaction(async (tx) => {
            const createdEvent = await tx.event.create({
                data: {
                    title: validated.title,
                    description: validated.description,
                    type: validated.isPublic ? 'PUBLIC' : 'PRIVATE',
                    startDate: validated.startDateTime,
                    endDate: validated.endDateTime,
                    location: validated.location,
                    latitude: validated.latitude,
                    longitude: validated.longitude,
                    isOnline: validated.isOnline,
                    onlineLink: validated.onlineLink,
                    capacity: validated.maxAttendees,
                    category: validated.category,
                    hostId: userId,
                    communityId: validated.communityId ?? undefined,
                    status: 'UPCOMING'
                }
            });

            await tx.eventOrganizer.create({
                data: {
                    eventId: createdEvent.id,
                    userId,
                    role: EventRole.HOST
                }
            });

            if (validated.causeIds?.length) {
                await tx.eventSocialCause.createMany({
                    data: validated.causeIds.map((causeId) => ({ eventId: createdEvent.id, causeId })),
                    skipDuplicates: true
                });
            }

            if (validated.rdgIds?.length) {
                await tx.eventRdgTag.createMany({
                    data: validated.rdgIds.map((rdgId) => ({ eventId: createdEvent.id, rdgId })),
                    skipDuplicates: true
                });
            }

            return createdEvent;
        });

        await createAuditLog({
            userId,
            action: AuditAction.CREATE,
            entityType: 'Event',
            entityId: event.id,
            newState: { title: event.title }
        });

        revalidatePath('/events');
        revalidateTag(CACHE_TAG_EVENTS, 'default');
        return { success: true, data: event, message: await localizeActionMessage('event.created') };
    } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
        if (error instanceof z.ZodError) {
            return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
        }
        logActionError('Create event error', error);
        return { success: false, error: await localizeActionMessage('common.saveFailed') };
    }
}

// Update type to include coverImage as optional
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateEventAction(userId: string, eventId: string, data: Partial<z.infer<typeof createEventSchema>> & { coverImage?: string }): Promise<ApiResponse<any>> {
  try {
    const hasCommunityId = Object.hasOwn(data, 'communityId');
    let communityIdForUpdate: string | null | undefined;
    if (!hasCommunityId) {
      communityIdForUpdate = undefined;
    } else if (typeof data.communityId === 'string' && data.communityId.trim().length === 0) {
      communityIdForUpdate = null;
    } else {
      communityIdForUpdate = data.communityId;
    }
    const causeIdsForUpdate = data.causeIds?.filter((causeId) => causeId.trim().length > 0);
    const rdgIdsForUpdate = data.rdgIds?.filter((rdgId) => rdgId.trim().length > 0);

    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: await localizeActionMessage('common.loginRequired') };
    }

    const actorUserId = currentUser.data.user.id;
    const canEdit = await canEditEvent(currentUser.data.user, eventId);

        if (!canEdit) {
            return { success: false, error: await localizeActionMessage('common.forbidden') };
        }

        if (communityIdForUpdate) {
            const canPostForCommunity = await canManageCommunityEvents(currentUser.data.user, communityIdForUpdate);
            if (!canPostForCommunity) {
                return { success: false, error: await localizeActionMessage('common.forbidden') };
            }
        }

        let eventType: 'PUBLIC' | 'PRIVATE' | undefined;
        if (data.isPublic !== undefined) {
            eventType = data.isPublic === true ? 'PUBLIC' : 'PRIVATE';
        }
        const event = await prisma.$transaction(async (tx) => {
            const updatedEvent = await tx.event.update({
                where: { id: eventId },
                data: {
                    title: data.title,
                    description: data.description,
                    type: eventType,
                    startDate: data.startDateTime,
                    endDate: data.endDateTime,
                    location: data.location,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    isOnline: data.isOnline,
                    onlineLink: data.onlineLink,
                    capacity: data.maxAttendees,
                    category: data.category,
                    coverImage: data.coverImage,
                    communityId: communityIdForUpdate,
                }
            });

            if (causeIdsForUpdate) {
                await tx.eventSocialCause.deleteMany({ where: { eventId } });
                if (causeIdsForUpdate.length > 0) {
                    await tx.eventSocialCause.createMany({
                        data: causeIdsForUpdate.map((causeId) => ({ eventId, causeId })),
                        skipDuplicates: true
                    });
                }
            }

            if (rdgIdsForUpdate) {
                await tx.eventRdgTag.deleteMany({ where: { eventId } });
                if (rdgIdsForUpdate.length > 0) {
                    await tx.eventRdgTag.createMany({
                        data: rdgIdsForUpdate.map((rdgId) => ({ eventId, rdgId })),
                        skipDuplicates: true
                    });
                }
            }

            return updatedEvent;
        });

        await createAuditLog({
            userId: actorUserId,
            action: AuditAction.UPDATE,
            entityType: 'Event',
            entityId: event.id,
            newState: {
                title: data.title,
                type: event.type,
                startDate: event.startDate,
                endDate: event.endDate,
                isOnline: event.isOnline,
                capacity: event.capacity,
                category: event.category,
            }
        });

        revalidatePath('/events');
        revalidatePath(`/events/${eventId}`);
        revalidateTag(CACHE_TAG_EVENTS, 'default');
        return { success: true, data: event, message: await localizeActionMessage('event.updated') };
    } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
        logActionError('Update event error', error);
        return { success: false, error: await localizeActionMessage('common.updateFailed') };
    }
}

export async function deleteEventAction(userId: string, eventId: string): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }

    const actorUserId = currentUser.data.user.id;
    const [existing, canEdit] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId }, select: { title: true } }),
      canEditEvent(currentUser.data.user, eventId),
    ]);

    if (!existing || !canEdit) {
      return { success: false, error: await localizeActionMessage('common.forbidden') };
    }

    await prisma.event.delete({ where: { id: eventId } });

        await createAuditLog({
            userId: actorUserId,
            action: AuditAction.DELETE,
            entityType: 'Event',
            entityId: eventId,
            previousState: { title: existing.title }
        });

        revalidatePath('/events');
        revalidateTag(CACHE_TAG_EVENTS, 'default');
        return { success: true, data: null, message: await localizeActionMessage('event.deleted') };
    } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
        logActionError('Delete event error', error);
        return { success: false, error: await localizeActionMessage('common.deleteFailed') };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEventAction(eventId: string): Promise<ApiResponse<any>> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        isOnline: true,
        onlineLink: true,
        capacity: true,
        category: true,
        type: true,
        coverImage: true,
        status: true,
        Community: {
          select: { id: true, name: true, city: true, coverImage: true }
        },
        organizers: {
          select: {
            role: true,
            user: { select: { id: true, name: true, displayName: true, profilePhoto: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        socialCauses: {
          select: { socialCause: { select: { id: true, slug: true, title: true } } }
        },
        rdgTags: {
          select: { RegenerativeGoal: { select: { id: true, key: true, label: true, labelHu: true, category: true } } }
        },
        User_Event_hostIdToUser: {
          select: {
            id: true,
            name: true,
            displayName: true,
            profilePhoto: true
          }
        },
        EventRsvp: {
          select: {
            id: true,
            status: true,
            User: {
              select: {
                id: true,
                name: true,
                displayName: true,
                profilePhoto: true
              }
            }
          }
        }
      }
    }) as EventDetailRow | null;
        if (!event) return { success: false, error: await localizeActionMessage('event.notFound') };
        return {
            success: true,
            data: {
                ...event,
                host: event.User_Event_hostIdToUser,
                community: event.Community,
                organizers: event.organizers,
                causes: event.socialCauses.map((link) => link.socialCause),
                rdgTags: event.rdgTags.map((link) => mapEventRdg(link.RegenerativeGoal)),
                rsvps: event.EventRsvp,
            }
        };
    } catch {
        return { success: false, error: await localizeActionMessage('common.loadFailed') };
    }
}

export async function searchEventsAction(query: string) {
    return getEvents({ search: query });
}

export async function rsvpEventAction(userId: string, eventId: string, status: RsvpStatus = RsvpStatus.REGISTERED): Promise<ApiResponse<unknown>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        const rsvp = await prisma.eventRsvp.upsert({
            where: {
                eventId_userId: {
                    eventId,
                    userId
                }
            },
            update: { status },
            create: {
                eventId,
                userId,
                status,
            }
        });
        revalidatePath(`/events/${eventId}`);
        return { success: true, data: rsvp, message: await localizeActionMessage('event.rsvpSuccess') };
    } catch {
        return { success: false, error: await localizeActionMessage('event.rsvpFailed') };
    }
}

export async function cancelEventAction(userId: string, eventId: string): Promise<ApiResponse<null>> {
    try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || currentUser.data?.user.id !== userId) {
      return { success: false, error: await localizeActionMessage('common.unauthorized') };
    }

    const rsvp = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true }
    });

        if (!rsvp) return { success: false, error: await localizeActionMessage('event.notRegistered') };

        await prisma.eventRsvp.delete({
            where: { eventId_userId: { eventId, userId } }
        });

        revalidatePath(`/events/${eventId}`);
        return { success: true, data: null, message: await localizeActionMessage('event.registrationCancelled') };
    } catch {
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}

export async function generateIcsAction(event: Record<string, unknown>) {
    const formatDate = (date: Date) => date.toISOString().replaceAll(/[-:]/g, '').split('.')[0] + 'Z';

    const content = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(new Date(event.startDate as string | number | Date))}`,
        `DTEND:${formatDate(new Date((event.endDate || event.startDate) as string | number | Date))}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${(event.description as string | null) ?? ''}`,
        `LOCATION:${event.location || (event.isOnline ? event.onlineLink : '')}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    return { success: true, data: content };
}

/**
 * Get upcoming events for the homepage
 */
export async function getUpcomingEventsAction(limit: number = 10): Promise<ApiResponse<unknown[]>> {
    try {
        const events = await prisma.event.findMany({
            where: {
                deletedAt: null,
                startDate: {
                    gte: new Date()
                },
                status: {
                    in: [EventStatus.UPCOMING, EventStatus.ONGOING]
                }
            },
            orderBy: {
                startDate: 'asc'
            },
            take: limit,
            select: {
                id: true,
                title: true,
                startDate: true,
                location: true,
                isOnline: true,
                category: true,
                coverImage: true,
                Community: {
                    select: { id: true, name: true }
                },
                User_Event_hostIdToUser: {
                    select: {
                        name: true,
                        displayName: true,
                    }
                }
            }
        });

        const mappedEvents = events.map(e => ({ ...e, host: e.User_Event_hostIdToUser, community: e.Community }));
        return { success: true, data: mappedEvents };
    } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
        logActionError('Upcoming events fetch error', error);
        return { success: false, error: await localizeActionMessage('event.upcomingFetchFailed') };
    }
}
