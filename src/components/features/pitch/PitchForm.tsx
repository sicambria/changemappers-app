'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createPitchAction, updatePitchAction, listRegenerativeGoalsAction, publishPitchAction } from '@/app/actions/pitch';
import RDGMultiSelect from './RDGMultiSelect';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { PitchStage } from '@/lib/prisma-shared';
import { DEFAULT_COMMONS_LICENSE, TEMPORAL_CLASS_PRESETS, TK_BC_PROTOCOL_LABELS } from '@/lib/cmap2';

interface PitchFormProps {
  pitch?: {
    id: string;
    name: string;
    summary: string;
    location: string;
    website: string | null;
    language: string;
    localContext: string;
    systemicChallenge: string;
    vision: string;
    expectedOutcomes: string;
    teamDescription: string;
    experience: string | null;
    evidenceLinks: string[];
    temporalClass?: string;
    license?: string;
    protocolLabels?: string[];
    casesWithProvenance?: boolean;
    notInRoomAck?: string | null;
    stage: PitchStage;
    mainObstacles: string;
    needsSkills: string[];
    needsFunding: boolean;
    fundingAmount: number | null;
    fundingCurrency: string | null;
    needsPartners: boolean;
    needsVolunteers: boolean;
    needsKnowledge: string | null;
    needsOther: string | null;
    callToAction: string;
    contactEmail: string | null;
    usePlatformMessaging: boolean;
    topicTags: string[];
    communityId: string | null;
    initiativeId: string | null;
    rdgTags: Array<{ rdg: { key: string } }>;
  };
  isEdit?: boolean;
}

const STAGE_VALUES: PitchStage[] = ['IDEA', 'RESEARCH', 'PROTOTYPE', 'PILOT', 'OPERATING', 'SCALING'];

function CharCounter({ value, max }: Readonly<{ value: string; max: number }>) {
  const remaining = max - value.length;
  const isNearLimit = remaining < max * 0.1;
  const isOverLimit = remaining < 0;
  let counterColor: string;
  if (isOverLimit) { counterColor = 'text-red-500'; }
  else if (isNearLimit) { counterColor = 'text-orange-500'; }
  else { counterColor = 'text-gray-400'; }
  return (
    <span
      className={`text-xs ${counterColor}`}
    >
      {remaining}
    </span>
  );
}

export default function PitchForm({ pitch, isEdit = false }: Readonly<PitchFormProps>) {
  const router = useRouter();
  const { t, i18n } = useTranslation('pitch');
  const [rdgOptions, setRdgOptions] = useState<Array<{
    id: string;
    key: string;
    label: string;
    labelHu: string | null;
    category: string;
  }>>([]);

  const [formState, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const isChecked = (field: string) => formData.get(field) !== null;
      const actionType = formData.get('action') as string;
      const data = {
        name: formData.get('name') as string,
        summary: formData.get('summary') as string,
        location: formData.get('location') as string,
        website: formData.get('website') as string || undefined,
        language: formData.get('language') as 'hu' | 'en',
        localContext: formData.get('localContext') as string,
        systemicChallenge: formData.get('systemicChallenge') as string,
        vision: formData.get('vision') as string,
        rdgTags: formData.get('rdgTags') ? JSON.parse(formData.get('rdgTags') as string) as string[] : [],
        expectedOutcomes: formData.get('expectedOutcomes') as string,
        teamDescription: formData.get('teamDescription') as string,
        experience: formData.get('experience') as string || undefined,
        evidenceLinks: formData.get('evidenceLinks') ? JSON.parse(formData.get('evidenceLinks') as string) as string[] : [],
        temporalClass: formData.get('temporalClass') as 'PROJECT' | 'SEASONAL' | 'GENERATIONAL',
        license: (formData.get('license') as string) || DEFAULT_COMMONS_LICENSE,
        protocolLabels: formData.getAll('protocolLabels') as Array<'TK_NOTICE' | 'TK_ATTRIBUTION' | 'BC_NOTICE' | 'BC_PROVENANCE'>,
        casesWithProvenance: isChecked('casesWithProvenance'),
        notInRoomAck: formData.get('notInRoomAck') as string || undefined,
        stage: formData.get('stage') as PitchStage,
        mainObstacles: formData.get('mainObstacles') as string,
        needsSkills: formData.get('needsSkills') ? JSON.parse(formData.get('needsSkills') as string) as string[] : [],
        needsFunding: isChecked('needsFunding'),
        fundingAmount: formData.get('fundingAmount') ? Number.parseInt(formData.get('fundingAmount') as string) : undefined,
        fundingCurrency: formData.get('fundingCurrency') as string || undefined,
        needsPartners: isChecked('needsPartners'),
        needsVolunteers: isChecked('needsVolunteers'),
        needsKnowledge: formData.get('needsKnowledge') as string || undefined,
        needsOther: formData.get('needsOther') as string || undefined,
        callToAction: formData.get('callToAction') as string,
        contactEmail: formData.get('contactEmail') as string || undefined,
        usePlatformMessaging: isChecked('usePlatformMessaging'),
      };

      let result;
      if (isEdit && pitch) {
        result = await updatePitchAction(pitch.id, data);
      } else {
        result = await createPitchAction(data);
      }

      if (result.success && result.data) {
        if (actionType === 'publish') {
          await publishPitchAction(result.data.id);
          router.push(`/pitch/${result.data.id}`);
        } else {
          router.push(`/pitch/${result.data.id}/edit`);
        }
      }
      return result;
    },
    null,
  );

  const [rdgTags, setRdgTags] = useState<string[]>(
    pitch?.rdgTags?.map((rdgT) => rdgT.rdg.key) ?? [],
  );

  useEffect(() => {
    listRegenerativeGoalsAction().then((result) => {
      if (result.success && result.data) {
        setRdgOptions(result.data);
      }
    });
  }, []);

  const [locationValue, setLocationValue] = useState<{name: string, country: string, lat: number, lng: number} | null>(
    pitch?.location ? { name: pitch.location, country: '', lat: 0, lng: 0 } : null
  );

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {isEdit ? t('form.editTitle') : t('form.pageTitle')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {isEdit ? t('form.editSubtitle') : t('form.pageSubtitle')}
      </p>

      <form action={formAction} className="space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.basics')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.name')} *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="name"
                  defaultValue={pitch?.name ?? ''}
                  maxLength={80}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.namePlaceholder')}
                />
                <CharCounter value={pitch?.name ?? ''} max={80} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.summary')} *
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="summary"
                  defaultValue={pitch?.summary ?? ''}
                  maxLength={200}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.summaryPlaceholder')}
                />
                <CharCounter value={pitch?.summary ?? ''} max={200} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.location')} *
              </label>
              <div className="flex items-center gap-2">
                <input type="hidden" name="location" value={locationValue?.name || ''} required />
                <div className="w-full">
                  <CityAutocomplete
                    value={locationValue}
                    onChange={setLocationValue}
                    placeholder={t('form.locationPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.website')}
              </label>
              <input
                type="url"
                name="website"
                defaultValue={pitch?.website ?? ''}
                maxLength={500}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.language')} *
              </label>
              <select
                name="language"
                defaultValue={pitch?.language ?? 'en'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="hu">{t('languageHu')}</option>
                <option value="en">{t('languageEn')}</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.contextSection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.localContext')} *
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="localContext"
                  defaultValue={pitch?.localContext ?? ''}
                  maxLength={500}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.localContextPlaceholder')}
                />
                <CharCounter value={pitch?.localContext ?? ''} max={500} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.systemicChallenge')} *
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="systemicChallenge"
                  defaultValue={pitch?.systemicChallenge ?? ''}
                  maxLength={300}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.systemicChallengePlaceholder')}
                />
                <CharCounter value={pitch?.systemicChallenge ?? ''} max={300} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.impactSection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.vision')} *
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="vision"
                  defaultValue={pitch?.vision ?? ''}
                  maxLength={300}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.visionPlaceholder')}
                />
                <CharCounter value={pitch?.vision ?? ''} max={300} />
              </div>
            </div>

            <div data-testid="selected-rdg-tags">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.rdgTags')} *
              </label>
              <input type="hidden" name="rdgTags" value={JSON.stringify(rdgTags)} />
              <RDGMultiSelect
                options={rdgOptions}
                value={rdgTags}
                onChange={setRdgTags}
                max={5}
                language={i18n.language as 'hu' | 'en' | 'es'}
              />
            </div>


            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.expectedOutcomes')} *
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="expectedOutcomes"
                  defaultValue={pitch?.expectedOutcomes ?? ''}
                  maxLength={400}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.expectedOutcomesPlaceholder')}
                />
                <CharCounter value={pitch?.expectedOutcomes ?? ''} max={400} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.credibilitySection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.teamDescription')} *
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="teamDescription"
                  defaultValue={pitch?.teamDescription ?? ''}
                  maxLength={300}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.teamDescriptionPlaceholder')}
                />
                <CharCounter value={pitch?.teamDescription ?? ''} max={300} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.experience')}
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  name="experience"
                  defaultValue={pitch?.experience ?? ''}
                  maxLength={300}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder={t('form.experiencePlaceholder')}
                />
                <CharCounter value={pitch?.experience ?? ''} max={300} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{t('form.stewardshipSection')}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.temporalClass')}</label>
              <select name="temporalClass" defaultValue={pitch?.temporalClass ?? 'PROJECT'} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                {TEMPORAL_CLASS_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.commonsLicense')}</label>
              <input name="license" defaultValue={pitch?.license ?? DEFAULT_COMMONS_LICENSE} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
              <p className="mt-1 text-xs text-gray-500">{t('form.protocolHelp')} <Link href="/about/governance/tk-bc-labels" className="text-emerald-700 underline">{t('form.readExplainer')}</Link>.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {TK_BC_PROTOCOL_LABELS.map((label) => (
                <label // NOSONAR(S6853) — implicit label/control association; the accessible name is computed from descendant text per the accname spec, which Sonar's depth-2 traversal misses
                  key={label.value} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <input type="checkbox" name="protocolLabels" value={label.value} defaultChecked={pitch?.protocolLabels?.includes(label.value)} className="mt-1" />
                  <span><span className="block font-medium">{label.label}</span><span className="block text-xs text-gray-500">{label.description}</span></span>
                </label>
              ))}
            </div>
            <label className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
              <input type="checkbox" name="casesWithProvenance" defaultChecked={pitch?.casesWithProvenance} className="mt-1" />
              <span>{t('form.casesWithProvenanceOptIn')}</span>
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.notInRoomAck')}</label>
              <textarea name="notInRoomAck" defaultValue={pitch?.notInRoomAck ?? ''} rows={2} maxLength={500} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.stageSection')}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('form.stage')} *
            </label>
            <select
              name="stage"
              defaultValue={pitch?.stage ?? 'IDEA'}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              {STAGE_VALUES.map((stageVal) => (
                <option key={stageVal} value={stageVal}>
                  {t(`stages.${stageVal}`)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.challengesSection')}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('form.mainObstacles')} *
            </label>
            <div className="flex items-start gap-2">
              <textarea
                name="mainObstacles"
                defaultValue={pitch?.mainObstacles ?? ''}
                maxLength={400}
                required
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                placeholder={t('form.mainObstaclesPlaceholder')}
              />
              <CharCounter value={pitch?.mainObstacles ?? ''} max={400} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.needsSection')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsFunding"
                name="needsFunding"
                defaultChecked={pitch?.needsFunding}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="needsFunding" className="text-sm text-gray-700 dark:text-gray-300">
                {t('form.needsFunding')}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsPartners"
                name="needsPartners"
                defaultChecked={pitch?.needsPartners}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="needsPartners" className="text-sm text-gray-700 dark:text-gray-300">
                {t('form.needsPartners')}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsVolunteers"
                name="needsVolunteers"
                defaultChecked={pitch?.needsVolunteers}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="needsVolunteers" className="text-sm text-gray-700 dark:text-gray-300">
                {t('form.needsVolunteers')}
              </label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.callToActionSection')}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('form.callToAction')} *
            </label>
            <div className="flex items-start gap-2">
              <textarea
                name="callToAction"
                defaultValue={pitch?.callToAction ?? ''}
                maxLength={200}
                required
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                placeholder={t('form.callToActionPlaceholder')}
              />
              <CharCounter value={pitch?.callToAction ?? ''} max={200} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('form.contactSection')}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.contactEmail')}
              </label>
              <input
                type="email"
                name="contactEmail"
                defaultValue={pitch?.contactEmail ?? ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usePlatformMessaging"
                name="usePlatformMessaging"
                defaultChecked={pitch?.usePlatformMessaging ?? true}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="usePlatformMessaging" className="text-sm text-gray-700 dark:text-gray-300">
                {t('form.usePlatformMessaging')}
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            name="action"
            value="draft"
            data-testid="pitch-submit-draft"
            disabled={isPending}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isPending ? t('form.saving') : t('form.submitDraft')}
          </button>
          <button
            type="submit"
            name="action"
            value="publish"
            data-testid="pitch-submit-publish"
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {(() => {
              if (isPending) return t('form.saving');
              if (isEdit) return t('form.submit');
              return t('form.publish');
            })()}
          </button>
        </div>


        {formState && !formState.success && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {formState.error ?? t('form.errorOccurred')}
          </div>
        )}
      </form>
    </div>
  );
}
