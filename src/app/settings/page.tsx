import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/get-current-user';
import { getServerTranslation } from '@/lib/server-i18n';
import prisma from '@/lib/prisma';
import { getCmapDisclosureStage } from '@/lib/cmap2';
import { allMenuItems } from '@/lib/menuConfig';
import { getLevelPreset } from '@/lib/cmapLevelPresets';
import { FeaturePreferencesClient, type FeatureGroup } from '@/components/features/settings/FeaturePreferencesClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return { title: `${t('settingsPage.title')} | Changemappers`, description: t('settingsPage.description') };
}

async function saveCmapReviewAction(formData: FormData) {
  'use server';
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) redirect('/login?redirect=/settings');
  const month = Number(formData.get('cmapReviewMonth'));
  await prisma.user.update({
    where: { id: auth.data.id },
    data: { cmapReviewMonth: Number.isInteger(month) && month >= 1 && month <= 12 ? month : null, cmapManualReviewAt: new Date() },
    select: { id: true },
  });
  revalidatePath('/settings');
}

const GROUP_DEFS = [
  { key: 'reflect', features: ['compass', 'reflect-checkin', 'reflect-deep', 'coachme', 'helpers'] },
  { key: 'connect', features: ['connections', 'video', 'matchmaking', 'growth-hub', 'planet', 'connect-nature'] },
  { key: 'learn', features: ['learning-central', 'stories', 'platform-intro', 'causes', 'cases'] },
  { key: 'map', features: ['map', 'social-issues', 'signals', 'energy'] },
  { key: 'tools', features: ['tools', 'graph', 'draw', 'canvas'] },
  { key: 'act', features: ['kanban', 'pitch', 'contribute', 'scheduling', 'calendar'] },
] as const;

function buildGroups(t: (key: string) => string): FeatureGroup[] {
  return GROUP_DEFS.map(g => ({
    key: g.key,
    label: t(`featurePreferences.group.${g.key}`),
    features: g.features.map(fId => {
      const item = allMenuItems.find(m => m.feature === fId);
      const tKey = item?.translationKey ?? `nav.${fId}`;
      const nsKey = tKey.includes(':') ? tKey.split(':')[1] : tKey;
      return { id: fId, label: t(nsKey) };
    }),
  }));
}

function buildLabels(t: (key: string) => string) {
  return {
    save: t('featurePreferences.save'),
    saving: t('featurePreferences.saving'),
    reset: t('featurePreferences.resetToPreset'),
    saved: t('featurePreferences.saved'),
  };
}

async function saveReflectionReminderOptOutAction(formData: FormData) {
  'use server';
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) redirect('/login?redirect=/settings');
  const optOut = formData.get('reflectionReminderOptOut') === 'true';
  await prisma.user.update({
    where: { id: auth.data.id },
    data: { reflectionReminderOptOut: optOut },
    select: { id: true },
  });
  revalidatePath('/settings');
}

type SettingsUser = {
  cmapReviewMonth: number | null;
  cmapManualReviewAt: Date | null;
  featureVisibilityPreferences: unknown;
  reflectionReminderOptOut: boolean;
  functionalProfile: { cmapLevel: number | null } | null;
};

function extractSettingsPrefs(user: SettingsUser | null) {
  if (!user) {
    return { cmapReviewMonth: null, cmapManualReviewAt: null, featureVisibilityPreferences: null, reflectionReminderOptOut: false, cmapLevel: null };
  }
  return {
    cmapReviewMonth: user.cmapReviewMonth,
    cmapManualReviewAt: user.cmapManualReviewAt,
    featureVisibilityPreferences: (user.featureVisibilityPreferences as Record<string, boolean> | null),
    reflectionReminderOptOut: user.reflectionReminderOptOut,
    cmapLevel: user.functionalProfile?.cmapLevel ?? null,
  };
}

async function fetchSettingsData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cmapReviewMonth: true,
      cmapManualReviewAt: true,
      featureVisibilityPreferences: true,
      reflectionReminderOptOut: true,
      functionalProfile: { select: { cmapLevel: true } },
    },
  });
  return extractSettingsPrefs(user);
}

export default async function SettingsPage() {
  const authResult = await getCurrentUser();
  if (!authResult.success || !authResult.data) redirect('/login?redirect=/settings');
  const { t } = await getServerTranslation('common');
  const data = await fetchSettingsData(authResult.data.id);
  const { cmapLevel, cmapManualReviewAt, cmapReviewMonth, featureVisibilityPreferences, reflectionReminderOptOut } = data;
  const stage = getCmapDisclosureStage(cmapLevel);
  const levelPreset = getLevelPreset(cmapLevel);
  const groups = buildGroups(t);
  const labels = buildLabels(t);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-6 dark:border-gray-800">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('settingsPage.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-950 dark:text-gray-50">{t('settingsPage.title')}</h1>
        <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-300">{t('settingsPage.description')}</p>
      </div>
      <section className="py-12">
        <h2 className="text-xl font-semibold text-gray-950 dark:text-gray-50">{t('settingsPage.privacyTitle')}</h2>
        <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">{t('settingsPage.privacyDescription')}</p>
        <Link href="/profile?tab=settings" className="mt-6 inline-flex items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-600">{t('settingsPage.openProfileSettings')}</Link>
      </section>
      <section className="border-t border-gray-200 py-12 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-950 dark:text-gray-50">{t('settingsPage.featureVisibilityTitle')}</h2>
        <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">
          {cmapLevel === null
            ? t('settingsPage.featureVisibilityNoLevel')
            : t('settingsPage.featureVisibilityDescription').replace('{{level}}', String(cmapLevel))}
        </p>
        <div className="mt-6">
          <FeaturePreferencesClient
            groups={groups}
            initialPrefs={featureVisibilityPreferences}
            levelDefault={[...levelPreset]}
            labels={labels}
          />
        </div>
      </section>
      <section className="border-t border-gray-200 py-12 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-950 dark:text-gray-50">{t('settingsPage.reflectionRemindersTitle')}</h2>
        <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">{t('settingsPage.reflectionRemindersDescription')}</p>
        <form action={saveReflectionReminderOptOutAction} className="mt-6 flex items-center gap-3">
          <input type="hidden" name="reflectionReminderOptOut" value={reflectionReminderOptOut ? 'false' : 'true'} />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={reflectionReminderOptOut}
              readOnly
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            {t('settingsPage.reflectionReminderOptOut')}
          </label>
          <button type="submit" className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800">
            {t('featurePreferences.save')}
          </button>
        </form>
      </section>
      <section className="border-t border-gray-200 py-12 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-950 dark:text-gray-50">{t('settingsPage.cmapReviewTitle')}</h2>
        <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">{t('settingsPage.cmapReviewDescription')}</p>
        <p className="mt-3 text-sm text-gray-500">{t('settingsPage.currentDisclosureStage', { stage })}</p>
        <form action={saveCmapReviewAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settingsPage.annualReviewMonth')}
            <select name="cmapReviewMonth" defaultValue={cmapReviewMonth ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
              <option value="">{t('settingsPage.chooseMonth')}</option>
              {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">{t('settingsPage.manualReviewNow')}</button>
        </form>
        {cmapManualReviewAt && <p className="mt-3 text-xs text-gray-500">{t('settingsPage.lastManualReview', { date: cmapManualReviewAt.toISOString().slice(0, 10) })}</p>}
      </section>
    </main>
  );
}
