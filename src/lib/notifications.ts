import { revalidatePath } from 'next/cache';
import prisma, { type NotificationType } from '@/lib/prisma';

export type NotificationCreateInput = {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    link?: string;
    senderId?: string;
    eventId?: string;
    communityId?: string;
};

export async function createNotificationRecord(input: NotificationCreateInput) {
    const notification = await prisma.notification.create({
        data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            link: input.link,
            senderId: input.senderId,
            eventId: input.eventId,
            communityId: input.communityId,
        }
    });

    revalidatePath('/');
    return notification;
}
