'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { needsAvailabilityPulse } from '@/app/services/freshness';

export async function checkPulseStatusAction() {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data?.user) return { needsPulse: false };

const user = await prisma.user.findUnique({
    where: { id: auth.data.user.id },
    select: {
      functionalProfile: {
        select: { functionsUpdatedAt: true }
      }
    }
  });

        if (!user?.functionalProfile) return { needsPulse: false };

        return { needsPulse: needsAvailabilityPulse(user.functionalProfile) };
    } catch {
        return { needsPulse: false };
    }
}
