'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import type { ApiResponse } from '@/types/modalities';

export type ForwardReciprocityTrigger = 'ACCEPTED_MATCH' | 'USED_TEMPLATE' | 'SAVED_PATTERN' | 'BROWSED_CASE';

export async function ensureForwardReciprocityPrompt(input: {
  userId: string;
  trigger: ForwardReciprocityTrigger;
  triggerEntityId?: string;
}): Promise<ApiResponse<{ id: string }>> {
  const prompt = await prisma.forwardReciprocityPrompt.upsert({
    where: { userId_trigger_triggerEntityId: { userId: input.userId, trigger: input.trigger, triggerEntityId: input.triggerEntityId ?? '' } },
    update: {},
    create: { userId: input.userId, trigger: input.trigger, triggerEntityId: input.triggerEntityId ?? '' },
    select: { id: true },
  });
  return { success: true, data: prompt };
}

export async function respondToForwardReciprocityPromptAction(input: {
  promptId: string;
  responseText?: string;
  createdOfferId?: string;
  skip?: boolean;
}): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const prompt = await prisma.forwardReciprocityPrompt.findUnique({ where: { id: input.promptId }, select: { id: true, userId: true } });
  if (!prompt || prompt.userId !== auth.data.id) return { success: false, error: 'Prompt not found' };

  const updated = await prisma.forwardReciprocityPrompt.update({
    where: { id: input.promptId },
    data: input.skip ? { skippedAt: new Date() } : { responseText: input.responseText?.trim() || null, createdOfferId: input.createdOfferId || null, completedAt: new Date() },
    select: { id: true },
  });
  revalidatePath('/dashboard');
  return { success: true, data: updated };
}
