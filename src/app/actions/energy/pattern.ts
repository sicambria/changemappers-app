'use server';
import { flattenError } from 'zod';

import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  proposeEnergyPatternSchema,
  type ProposeEnergyPatternInput,
} from '@/lib/validations/energy';
import { CACHE_TAG_ENERGY_PATTERNS } from '@/lib/cache-tags';
import type { ApiResponse } from '@/types/modalities';

export async function proposeEnergyPatternAction(
  input: ProposeEnergyPatternInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = proposeEnergyPatternSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const pattern = await prisma.energyPatternEntry.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      definition: parsed.data.definition,
      structuralSignature: parsed.data.structuralSignature as object,
      mechanismDescription: parsed.data.mechanismDescription,
      leveragePoints: parsed.data.leveragePoints,
      realWorldExamples: parsed.data.realWorldExamples,
      status: 'PROPOSED',
      proposedById: auth.data.id,
    },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_ENERGY_PATTERNS, 'default');
  return { success: true, data: { id: pattern.id } };
}

export async function validateEnergyPatternAction(id: string): Promise<ApiResponse<void>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  if (!auth.data.isAdmin) {
    return { success: false, error: 'Admin only' };
  }

  await prisma.energyPatternEntry.update({
    where: { id },
    data: { status: 'VALIDATED' },
  });

  revalidateTag(CACHE_TAG_ENERGY_PATTERNS, 'default');
  return { success: true, data: undefined };
}

export async function retireEnergyPatternAction(id: string): Promise<ApiResponse<void>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  if (!auth.data.isAdmin) {
    return { success: false, error: 'Admin only' };
  }

  await prisma.energyPatternEntry.update({
    where: { id },
    data: { status: 'RETIRED' },
  });

  revalidateTag(CACHE_TAG_ENERGY_PATTERNS, 'default');
  return { success: true, data: undefined };
}

export async function getEnergyPatternLibraryAction(category?: string) {
  return prisma.energyPatternEntry.findMany({
    where: {
      status: { in: ['PROPOSED', 'VALIDATED'] },
      ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      definition: true,
      structuralSignature: true,
      mechanismDescription: true,
      leveragePoints: true,
      realWorldExamples: true,
      status: true,
      createdAt: true,
      proposedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });
}
