'use server';

import { logActionError } from '@/lib/action-logger';
import { isDynamicServerUsageError } from '@/lib/server-action-errors';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUserData } from '@/lib/get-current-user';
import { canExposeProfileField, getProfileExposureSettings, toVisibleStringArray } from '@/lib/profile-exposure';

import type { ApiResponse } from '@/types/common';

type ProfileVisibility = 'PUBLIC' | 'REGISTERED' | 'CONNECTIONS';
type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected' | null;

type HoverUser = {
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
  bio: string | null;
  motto: string | null;
  rdgAreas: string[];
  mainCauses: Array<{ id: string; title: string }>;
  profileVisibility: ProfileVisibility;
  isSuspended: boolean;
  processingRestricted: boolean;
  federationSettings: unknown;
};

const searchUsersSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20).default(10),
});

function determineConnectionStatus(
  connection: { status: string; senderId: string } | null,
  senderId: string,
): ConnectionStatus {
  if (!connection) return 'none';
  if (connection.status === 'ACCEPTED') return 'connected';
  if (connection.status === 'PENDING') {
    return connection.senderId === senderId ? 'pending_sent' : 'pending_received';
  }
  return null;
}

async function canViewProfileSummary(input: {
  targetUser: HoverUser;
  currentUserId: string | null | undefined;
  isAdmin: boolean;
}): Promise<boolean> {
  const { targetUser, currentUserId, isAdmin } = input;
  if (targetUser.isSuspended || targetUser.processingRestricted) return false;
  if (isAdmin || currentUserId === targetUser.id) return true;
  if (targetUser.profileVisibility === 'PUBLIC') return true;
  if (targetUser.profileVisibility === 'REGISTERED') return Boolean(currentUserId);
  if (targetUser.profileVisibility !== 'CONNECTIONS' || !currentUserId) return false;

  const connection = await prisma.connection.findFirst({
    where: {
      status: 'ACCEPTED',
      deletedAt: null,
      OR: [
        { senderId: currentUserId, receiverId: targetUser.id },
        { senderId: targetUser.id, receiverId: currentUserId },
      ],
    },
    select: { id: true },
  });

  return Boolean(connection);
}

export async function searchUsersForMentionAction(
  query: string,
  limit: number = 10
): Promise<ApiResponse<{
  users: Array<{
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
    bio: string | null;
  }>;
}>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = searchUsersSchema.parse({ query, limit });

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isSuspended: false,
        processingRestricted: false,
        profileVisibility: { in: ['PUBLIC', 'REGISTERED'] },
        OR: [
          { name: { contains: validated.query, mode: 'insensitive' } },
          { displayName: { contains: validated.query, mode: 'insensitive' } },
        ],
      },
      take: validated.limit,
      select: {
        id: true,
        name: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
        federationSettings: true,
      },
    });

    const visibleUsers = users.map((user) => {
      const publicProfile = getProfileExposureSettings(user.federationSettings);
      return {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        profilePhoto: canExposeProfileField(publicProfile, 'showAvatar') ? user.profilePhoto : null,
        bio: canExposeProfileField(publicProfile, 'showBio') ? user.bio : null,
      };
    });

    return { success: true, data: { users: visibleUsers } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('searchUsersForMentionAction', error);
    return { success: false, error: 'Failed to search users' };
  }
}

export async function getUserHoverSummaryAction(
  userId: string
): Promise<ApiResponse<{
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
  bio: string | null;
  motto: string | null;
  rdgAreas: string[];
  mainCauses: Array<{ id: string; title: string }>;
  connectionStatus: ConnectionStatus;
}>> {
  try {
    const userResult = await getCurrentUserData();
    const currentUser = userResult.success ? userResult.data?.user : null;
    const currentUserId = currentUser?.id ?? null;
    const isAdmin = Boolean(currentUser?.isAdmin);

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
        motto: true,
        rdgAreas: true,
        profileVisibility: true,
        isSuspended: true,
        processingRestricted: true,
        federationSettings: true,
        mainCauses: {
          select: { id: true, title: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const canViewSummary = await canViewProfileSummary({
      targetUser: user as HoverUser,
      currentUserId,
      isAdmin,
    });

    if (!canViewSummary) {
      return { success: false, error: 'User not found' };
    }

    let connectionStatus: ConnectionStatus = null;

    if (currentUserId && currentUserId !== userId) {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
          ],
        },
        select: { status: true, senderId: true },
      });

      connectionStatus = determineConnectionStatus(connection, currentUserId);
    }

    const publicProfile = getProfileExposureSettings(user.federationSettings);
    const canSeeAllFields = isAdmin || currentUserId === user.id;

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        profilePhoto: canExposeProfileField(publicProfile, 'showAvatar', canSeeAllFields) ? user.profilePhoto : null,
        bio: canExposeProfileField(publicProfile, 'showBio', canSeeAllFields) ? user.bio : null,
        motto: canExposeProfileField(publicProfile, 'showBio', canSeeAllFields) ? user.motto : null,
        rdgAreas: toVisibleStringArray(user.rdgAreas, publicProfile, 'showRdgAreas', canSeeAllFields),
        mainCauses: canExposeProfileField(publicProfile, 'showCauses', canSeeAllFields) ? user.mainCauses : [],
        connectionStatus,
      },
    };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('getUserHoverSummaryAction', error);
    return { success: false, error: 'Failed to get user summary' };
  }
}
