'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getNotificationsAction(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    const currentUserId = currentUser.success ? currentUser.data?.user.id : null;
    if (!currentUserId || currentUserId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            displayName: true,
            profilePhoto: true
          }
        }
      }
    });
    return { success: true, data: notifications };
  } catch {
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

export async function markAsReadAction(notificationId: string) {
    try {
        const currentUser = await getCurrentUser();
        const currentUserId = currentUser.success ? currentUser.data?.user.id : null;
        if (!currentUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { id: true, userId: true },
        });
        if (notification?.userId !== currentUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.notification.update({
            where: { id: notification.id },
            data: { isRead: true }
        });
        revalidatePath('/'); // Revalidate everywhere as header is global
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to update notification' };
    }
}

export async function markAllAsReadAction(userId: string) {
    try {
        const currentUser = await getCurrentUser();
        const currentUserId = currentUser.success ? currentUser.data?.user.id : null;
        if (!currentUserId || currentUserId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: { isRead: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to update notifications' };
    }
}
