'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import { sendAnnouncementEmail } from '@/lib/email';

export async function getActiveAnnouncements() {
  try {
    const userRes = await getCurrentUser();
    const userId = userRes.success && userRes.data ? userRes.data.user.id : null;

    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { isPermanent: true },
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        backgroundColor: true,
        textColor: true,
        isPermanent: true,
        requireAck: true,
        acknowledgements: userId ? {
          where: { userId },
          select: { userId: true },
        } : false,
      },
  orderBy: {
  createdAt: 'desc',
  },
  take: 20,
});

    // Filter out acknowledgement-required announcements after this user has acknowledged them.
    return announcements.filter(a => {
      if (!a.requireAck) return true;
      if (!userId) return true;
      return !a.acknowledgements.some(ack => ack.userId === userId);
    });
  } catch (error) {
    logActionError('Failed to fetch announcements', error);
    return [];
  }
}

export async function acknowledgeAnnouncement(announcementId: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = userRes.data.user.id;

  try {
    await prisma.announcementAck.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      update: {
        acknowledgedAt: new Date(),
      },
      create: {
        announcementId,
        userId,
        acknowledgedAt: new Date(),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logActionError('Failed to acknowledge announcement', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

// Admin Actions

export async function adminCreateAnnouncement(formData: FormData) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data?.user.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const type = formData.get('type') as 'INFO' | 'SECURITY';
  const backgroundColor = formData.get('backgroundColor') as string || null;
  const textColor = formData.get('textColor') as string || null;
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const isPermanent = formData.get('isPermanent') === 'true';
  const requireAck = formData.get('requireAck') === 'true';
  const sendEmail = formData.get('sendEmail') === 'true';

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        backgroundColor,
        textColor,
        startDate,
        endDate,
        isPermanent,
        requireAck,
        sendEmail,
      },
    });

    if (sendEmail) {
      // Background task would be better, but for now we send to all
	const users = await prisma.user.findMany({
		where: { deletedAt: null, isEmailVerified: true },
		select: { email: true, uiLanguage: true },
		take: 1000,
		});
      
      const emailsByLanguage = new Map<string, string[]>();
      for (const user of users) {
        const language = user.uiLanguage || 'en';
        const emails = emailsByLanguage.get(language) ?? [];
        emails.push(user.email);
        emailsByLanguage.set(language, emails);
      }
      for (const [language, emails] of emailsByLanguage) {
        await sendAnnouncementEmail(emails, title, content, type, language);
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/announcements');
    return { success: true, data: announcement };
  } catch (error) {
    logActionError('Failed to create announcement', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function adminUpdateAnnouncement(id: string, formData: FormData) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data?.user.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const type = formData.get('type') as 'INFO' | 'SECURITY';
  const backgroundColor = formData.get('backgroundColor') as string || null;
  const textColor = formData.get('textColor') as string || null;
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const isPermanent = formData.get('isPermanent') === 'true';
  const requireAck = formData.get('requireAck') === 'true';
  const isActive = formData.get('isActive') === 'true';

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  try {
    await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        type,
        backgroundColor,
        textColor,
        startDate,
        endDate,
        isPermanent,
        requireAck,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    logActionError('Failed to update announcement', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function adminDeleteAnnouncement(id: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data?.user.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.announcement.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    logActionError('Failed to delete announcement', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function adminGetAnnouncements() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data?.user.isAdmin) {
    throw new Error('Unauthorized');
  }

	return await prisma.announcement.findMany({
	select: {
		id: true, title: true, content: true, type: true,
		backgroundColor: true, textColor: true, startDate: true, endDate: true,
		isPermanent: true, isActive: true, requireAck: true, sendEmail: true,
		createdAt: true, updatedAt: true,
	},
	orderBy: { createdAt: 'desc' },
	take: 100,
	});
}

export async function adminGetAnnouncement(id: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data?.user.isAdmin) {
    throw new Error('Unauthorized');
  }

  return await prisma.announcement.findUnique({
    where: { id },
    select: {
      id: true, title: true, content: true, type: true,
      backgroundColor: true, textColor: true, startDate: true, endDate: true,
      isPermanent: true, isActive: true, requireAck: true, sendEmail: true,
      createdAt: true, updatedAt: true,
    },
  });
}
