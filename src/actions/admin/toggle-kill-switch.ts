'use server';

import { getCurrentUser } from '@/lib/get-current-user';
import { toggleKillSwitch, KillSwitchFeature } from '@/lib/security/kill-switch';
import { revalidatePath } from 'next/cache';

export interface ToggleKillSwitchResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action to toggle a global feature kill switch.
 * Only accessible by administrators.
 */
export async function toggleKillSwitchAction(
  feature: KillSwitchFeature,
  enabled: boolean,
  reasoning: string
): Promise<ToggleKillSwitchResult> {
  const auth = await getCurrentUser();

  if (!auth.success || !auth.data.isAdmin) {
    return { success: false, error: 'common:errors.unauthorized' };
  }

  const result = await toggleKillSwitch({
    feature,
    enabled,
    reasoning,
    userId: auth.data.id,
    userEmail: auth.data.email,
  });

  if (result.success) {
    revalidatePath('/admin/security');
  }

  return result;
}
