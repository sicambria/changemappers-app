'use server';

import { logActionError } from '@/lib/action-logger';
import { logger } from '@/lib/logger';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import type { ApiResponse } from '@/types/common';

interface VideoRoomResult {
  roomName: string;
}

const ROOM_PREFIX = 'changemappers-video';

// Lazily-generated, process-local fallback secret. Only used outside production
// when VIDEO_ROOM_HMAC_SECRET is not configured, so room names stay pseudonymized
// without reusing JWT_SECRET (key separation - see AUDIT-20260612-013).
let devFallbackVideoRoomSecret: string | null = null;

function getVideoRoomSecret(): string {
  const configured = process.env.VIDEO_ROOM_HMAC_SECRET;
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('VIDEO_ROOM_HMAC_SECRET must be set in production for video room name derivation');
  }

  if (!devFallbackVideoRoomSecret) {
    devFallbackVideoRoomSecret = crypto.randomBytes(32).toString('hex');
    logger.warn({ msg: 'VIDEO_ROOM_HMAC_SECRET is not set — using a random per-process secret for video room name derivation. Set VIDEO_ROOM_HMAC_SECRET for stable room names across restarts.' });
  }
  return devFallbackVideoRoomSecret;
}

function buildPartnerRoomName(userId: string, partnerId: string): string {
  const participantPair = [userId, partnerId].sort((a, b) => a.localeCompare(b)).join(':');
  const digest = crypto
    .createHmac('sha256', getVideoRoomSecret())
    .update(participantPair)
    .digest('base64url')
    .slice(0, 32);

  return `${ROOM_PREFIX}-${digest}`;
}

export async function getVideoRoomForPartnerAction(partnerId: string): Promise<ApiResponse<VideoRoomResult>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = currentUser.data.user.id;
    const normalizedPartnerId = partnerId.trim();

    if (!normalizedPartnerId) {
      return { success: false, error: 'Partner is required' };
    }

    if (userId === normalizedPartnerId) {
      return { success: false, error: 'Cannot start a video call with yourself' };
    }

    const relationship = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: normalizedPartnerId },
          { senderId: normalizedPartnerId, receiverId: userId },
        ],
      },
      select: { id: true, status: true },
    });

    if (!relationship) {
      return { success: false, error: 'Accepted connection required' };
    }

    if (relationship.status === 'BLOCKED') {
      return { success: false, error: 'Cannot start a video call with this user' };
    }

    if (relationship.status !== 'ACCEPTED') {
      return { success: false, error: 'Accepted connection required' };
    }

    return {
      success: true,
      data: { roomName: buildPartnerRoomName(userId, normalizedPartnerId) },
    };
  } catch (error) {
    logActionError('Video room action error', error);
    return { success: false, error: 'Failed to prepare video room' };
  }
}
