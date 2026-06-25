'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { prisma, FeedbackStatus } from '@/lib/prisma';
import type { Prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { sendAdminNotification } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { headers } from 'next/headers';
import { escapeHtml } from '@/lib/html';
import { rateLimitAsync } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';

export interface FeedbackFilters {
  status?: FeedbackStatus;
  type?: 'LIKE' | 'DISLIKE';
  search?: string;
}

const feedbackSchema = z.object({
  type: z.enum(['LIKE', 'DISLIKE']),
  expectation: z.string().trim().min(1, 'feedback.validation.expectationRequired').max(5000),
  reality: z.string().trim().min(1, 'feedback.validation.realityRequired').max(5000),
  improvement: z.string().trim().max(5000).optional(),
  otherComment: z.string().trim().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()),
});

const feedbackSettingsSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['bottom-right', 'bottom-left']),
});

const feedbackStatusSchema = z.enum(['NEW', 'IN_PROGRESS', 'DONE']);

export interface FeedbackData {
  type: 'LIKE' | 'DISLIKE';
  expectation: string;
  reality: string;
  improvement?: string;
  otherComment?: string;
  metadata: Record<string, unknown>;
}

export async function submitFeedback(data: FeedbackData) {
  try {
    const headerList = await headers();
    const ip = getClientIp(headerList);
    const rl = await rateLimitAsync(`feedback_${ip}`, 5, 60 * 60 * 1000);
    if (!rl.success) {
      return { success: false, error: await localizeActionMessage('feedback.tooManySubmissions') };
    }

    const validated = feedbackSchema.parse(data);
    const auth = await getCurrentUser();
    const userId = auth.success ? auth.data?.user?.id ?? null : null;

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type: validated.type,
        expectation: validated.expectation,
        reality: validated.reality,
        improvement: validated.improvement,
        otherComment: validated.otherComment,
        metadata: validated.metadata as Prisma.InputJsonObject,
      },
    });

    // Send email to admin
    const subject = await localizeActionMessage('feedback.email.subject', { type: validated.type });
    const html = `
      <div style="font-family: sans-serif;">
        <h2>${await localizeActionMessage('feedback.email.title')}</h2>
        <p><strong>${await localizeActionMessage('feedback.email.typeLabel')}</strong> ${escapeHtml(validated.type)}</p>
        <p><strong>${await localizeActionMessage('feedback.email.expectationLabel')}</strong><br/>${escapeHtml(validated.expectation)}</p>
        <p><strong>${await localizeActionMessage('feedback.email.realityLabel')}</strong><br/>${escapeHtml(validated.reality)}</p>
        ${validated.improvement ? `<p><strong>${await localizeActionMessage('feedback.email.improvementLabel')}</strong><br/>${escapeHtml(validated.improvement)}</p>` : ''}
        ${validated.otherComment ? `<p><strong>${await localizeActionMessage('feedback.email.otherLabel')}</strong><br/>${escapeHtml(validated.otherComment)}</p>` : ''}
        <p><strong>${await localizeActionMessage('feedback.email.userIdLabel')}</strong> ${escapeHtml(userId || await localizeActionMessage('feedback.email.guest'))}</p>
      </div>
    `;
    const text = `${subject}\n\n${await localizeActionMessage('feedback.email.expectationText')}: ${validated.expectation}\n${await localizeActionMessage('feedback.email.realityText')}: ${validated.reality}\n\nMetadata:\n${JSON.stringify(validated.metadata, null, 2)}`;

    await sendAdminNotification(subject, html, text);

    return { success: true, id: feedback.id };
  } catch (error) {
    logActionError('Feedback submission error', error);
    return { success: false, error: await localizeActionMessage('feedback.submitFailed') };
  }
}

export async function adminGetFeedbacks(page = 1, pageSize = 20, filters?: FeedbackFilters) {
  try {
    const auth = await getCurrentUser();
    if (!auth.success || !auth.data?.user?.isAdmin) {
      throw new Error(await localizeActionMessage('common.unauthorized'));
    }

    const skip = (page - 1) * pageSize;

    const where: Prisma.FeedbackWhereInput = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { expectation: { contains: q, mode: 'insensitive' } },
        { reality: { contains: q, mode: 'insensitive' } },
        { improvement: { contains: q, mode: 'insensitive' } },
        { otherComment: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [feedbacks, totalCount] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          User: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.feedback.count({ where })
    ]);

    return {
      success: true,
      data: feedbacks,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    logActionError('Admin get feedback error', error);
    return { success: false, error: await localizeActionMessage('feedback.fetchFailed') };
  }
}

export async function adminUpdateFeedbackStatus(id: string, status: FeedbackStatus) {
  try {
    const auth = await getCurrentUser();
    if (!auth.success || !auth.data?.user?.isAdmin) {
      throw new Error(await localizeActionMessage('common.unauthorized'));
    }

    const validatedStatus = feedbackStatusSchema.parse(status);

    await prisma.feedback.update({
      where: { id },
      data: { status: validatedStatus },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logActionError('Admin update feedback status error', error);
    return { success: false, error: await localizeActionMessage('feedback.statusUpdateFailed') };
  }
}

export async function adminUpdateFeedbackSettings(enabled: boolean, position: 'bottom-right' | 'bottom-left') {
  try {
    const auth = await getCurrentUser();
    if (!auth.success || !auth.data?.user?.isAdmin) {
      throw new Error(await localizeActionMessage('common.unauthorized'));
    }

    const settings = feedbackSettingsSchema.parse({ enabled, position });

    await Promise.all([
      prisma.siteConfig.upsert({
        where: { key: 'feedbackButtonEnabled' },
        update: { value: String(settings.enabled) },
        create: { key: 'feedbackButtonEnabled', value: String(settings.enabled) },
      }),
      prisma.siteConfig.upsert({
        where: { key: 'feedbackButtonPosition' },
        update: { value: settings.position },
        create: { key: 'feedbackButtonPosition', value: settings.position },
      }),
    ]);

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logActionError('Admin update feedback settings error', error);
    return { success: false, error: await localizeActionMessage('feedback.settingsUpdateFailed') };
  }
}
