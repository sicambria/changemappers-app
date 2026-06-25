'use server';

// Shared admin gate for the demo seed actions.
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { getCurrentUser } from "@/app/actions/auth";

export async function assertAdmin() {
  const userResult = await getCurrentUser();
  if (!userResult.success || !userResult.data?.user)
    throw new Error(await localizeActionMessage('common.loginRequired'));
  if (!userResult.data.user.isAdmin) throw new Error(await localizeActionMessage('common.unauthorized'));
  return userResult.data.user;
}
