import { cache } from 'react';
import prisma from '@/lib/prisma';

/**
 * Read a SiteConfig value by key.
 * Returns null when no row exists (treat as "not set" / use default).
 * Import this in server components and 'use server' actions — not in client code.
 *
 * Wrapped in React `cache()` so repeated reads of the same key within one
 * request hit the database only once (AUDIT-20260613-013). Request-scoped:
 * admin changes are picked up by the next request, so freshness semantics are
 * unchanged. Outside a React server request scope `cache()` is a passthrough.
 */
export const getSiteConfigValue = cache(async (key: string): Promise<string | null> => {
    const config = await prisma.siteConfig.findUnique({ where: { key }, select: { value: true } });
    return config?.value ?? null;
});

/**
 * Returns true when invite codes are required for registration.
 * Default: true (require invite code).
 */
export async function isInviteCodeRequired(): Promise<boolean> {
    const value = await getSiteConfigValue('requireInviteCode');
    return value !== 'false';
}

export async function getFeedbackConfig(): Promise<{ enabled: boolean; position: 'bottom-right' | 'bottom-left' }> {
    // Parallel reads: the two keys are independent (AUDIT-20260613-013).
    const [enabled, position] = await Promise.all([
        getSiteConfigValue('feedbackButtonEnabled'),
        getSiteConfigValue('feedbackButtonPosition'),
    ]);
    return {
        enabled: enabled !== 'false',
        position: (position as 'bottom-right' | 'bottom-left') || 'bottom-right',
    };
}
