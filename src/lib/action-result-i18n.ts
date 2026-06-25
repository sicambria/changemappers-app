import { getServerTranslation } from './server-i18n';

export type ActionMessageParams = Record<string, string | number | boolean | null | undefined>;

const ACTION_NAMESPACE = 'actions';

export async function localizeActionMessage(key: string, params?: ActionMessageParams): Promise<string> {
  const { t } = await getServerTranslation(ACTION_NAMESPACE);
  return t(key, params);
}

export async function localizeActionZodError(error: unknown, fallbackKey: string): Promise<string> {
  const key = error && typeof error === 'object' && 'issues' in error
    ? (error as { issues?: Array<{ message?: string }> }).issues?.[0]?.message
    : undefined;

  return localizeActionMessage(key || fallbackKey);
}
