'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeIcon, ShieldAlertIcon, ShieldCheckIcon, Share2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { updateFediverseSettingsAction } from '@/app/actions/profile';
import {
  DEFAULT_FEDIVERSE_SETTINGS,
  FEDIVERSE_CONSENT_VERSION,
  normalizeFediverseSettings,
  type FediverseSettings,
} from '@/lib/federation/settings';

interface FediverseSettingsCardProps {
  settings: unknown;
  consentAt?: string;
  profileVisibility?: string;
  onSaved?: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: Readonly<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}>) {
  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border p-3 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-checked={checked}
        aria-label={label}
        role="switch"
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`}
      >
        <span
          aria-hidden="true"
          className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
        />
      </button>
    </div>
  );
}

export function FediverseSettingsCard({
  settings,
  consentAt,
  profileVisibility,
  onSaved,
}: Readonly<FediverseSettingsCardProps>) {
  const { t, i18n } = useTranslation('profiles');
  const dateTimeLocale = i18n.resolvedLanguage || 'en';
  const [draft, setDraft] = useState<FediverseSettings>(() => normalizeFediverseSettings(settings));
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasConsent = (draft.consentVersion ?? 0) >= FEDIVERSE_CONSENT_VERSION;
  const activityPubBlockedByVisibility = profileVisibility !== 'PUBLIC';
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(normalizeFediverseSettings(settings)),
    [draft, settings],
  );

  const updateDraft = (next: FediverseSettings) => {
    setDraft(next);
    setMessage(null);
    setError(null);
  };

  const save = async (next: FediverseSettings) => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    const result = await updateFediverseSettingsAction(next);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error || t('fediverse.saveFailed'));
      return;
    }

    setDraft(next);
    setMessage(t('fediverse.savedMessage'));
    setShowConsentDialog(false);
    setConsentChecked(false);
    onSaved?.();
  };

  const handleSave = async () => {
    if (draft.activityPub.enabled && !hasConsent) {
      setShowConsentDialog(true);
      return;
    }
    await save(draft);
  };

  return (
    <>
      {showConsentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl dark:bg-gray-950">
            <div className="flex items-center gap-3">
              <ShieldAlertIcon className="h-6 w-6 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('fediverse.consent.title')}</h3>
        </div>
        <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            {t('fediverse.consent.body1')}
          </p>
          <p>
            {t('fediverse.consent.body2')}
          </p>
          {/* SAFE: value is a static locale string with only <strong> tags, no user input */}
          <p dangerouslySetInnerHTML={{ __html: t('fediverse.consent.body3') }} />
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-xl border p-3">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(event) => setConsentChecked(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {t('fediverse.consent.checkboxLabel')}
        </span>
            </label>
            <div className="mt-5 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setShowConsentDialog(false)}>
          {t('fediverse.consent.cancel')}
        </Button>
        <Button
          className="flex-1"
          disabled={!consentChecked}
          onClick={() => save({ ...draft, consentVersion: FEDIVERSE_CONSENT_VERSION })}
        >
          {t('fediverse.consent.confirm')}
        </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
        <Share2Icon className="h-5 w-5 text-emerald-600" />
        {t('fediverse.cardTitle')}
      </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-200">
        <p className="font-medium">{t('fediverse.whatThisControls')}</p>
        <p className="mt-1">
          {t('fediverse.whatThisControlsDesc')}
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
        <p className="font-medium">{t('fediverse.privacyNote')}</p>
        <p className="mt-1">
          {t('fediverse.privacyNoteDesc')}
        </p>
      </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <GlobeIcon className="h-4 w-4 text-emerald-600" />
        {t('fediverse.publicProfile')}
      </div>
      <ToggleRow
        label={t('fediverse.toggles.showAvatar.label')}
        description={t('fediverse.toggles.showAvatar.desc')}
        checked={draft.publicProfile.showAvatar}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showAvatar: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showCoverImage.label')}
        description={t('fediverse.toggles.showCoverImage.desc')}
        checked={draft.publicProfile.showCoverImage}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showCoverImage: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showBio.label')}
        description={t('fediverse.toggles.showBio.desc')}
        checked={draft.publicProfile.showBio}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showBio: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showLocation.label')}
        description={t('fediverse.toggles.showLocation.desc')}
        checked={draft.publicProfile.showLocation}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showLocation: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showWebsite.label')}
        description={t('fediverse.toggles.showWebsite.desc')}
        checked={draft.publicProfile.showWebsite}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showWebsite: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showSocialLinks.label')}
        description={t('fediverse.toggles.showSocialLinks.desc')}
        checked={draft.publicProfile.showSocialLinks}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showSocialLinks: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showSkills.label')}
        description={t('fediverse.toggles.showSkills.desc')}
        checked={draft.publicProfile.showSkills}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showSkills: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showOffers.label')}
        description={t('fediverse.toggles.showOffers.desc')}
        checked={draft.publicProfile.showOffers}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showOffers: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showNeeds.label')}
        description={t('fediverse.toggles.showNeeds.desc')}
        checked={draft.publicProfile.showNeeds}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showNeeds: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showValues.label')}
        description={t('fediverse.toggles.showValues.desc')}
        checked={draft.publicProfile.showValues}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showValues: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showInterests.label')}
        description={t('fediverse.toggles.showInterests.desc')}
        checked={draft.publicProfile.showInterests}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showInterests: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showRdgAreas.label')}
        description={t('fediverse.toggles.showRdgAreas.desc')}
        checked={draft.publicProfile.showRdgAreas}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showRdgAreas: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showCauses.label')}
        description={t('fediverse.toggles.showCauses.desc')}
        checked={draft.publicProfile.showCauses}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showCauses: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showArchetypes.label')}
        description={t('fediverse.toggles.showArchetypes.desc')}
        checked={draft.publicProfile.showArchetypes}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showArchetypes: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showChangemakerLevel.label')}
        description={t('fediverse.toggles.showChangemakerLevel.desc')}
        checked={draft.publicProfile.showChangemakerLevel}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showChangemakerLevel: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showIntentions.label')}
        description={t('fediverse.toggles.showIntentions.desc')}
        checked={draft.publicProfile.showIntentions}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showIntentions: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showBoundaries.label')}
        description={t('fediverse.toggles.showBoundaries.desc')}
        checked={draft.publicProfile.showBoundaries}
        onChange={(value) => updateDraft({ ...draft, publicProfile: { ...draft.publicProfile, showBoundaries: value } })}
      />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <Share2Icon className="h-4 w-4 text-emerald-600" />
        {t('fediverse.activitypub')}
      </div>
      {/* SAFE: visibility is a controlled enum from the database (PUBLIC/REGISTERED/etc.), not user free-text; template only adds <strong> tags */}
      {activityPubBlockedByVisibility && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200"
          dangerouslySetInnerHTML={{ __html: t('fediverse.activitypubBlocked', { visibility: profileVisibility || 'unknown' }) }}
        />
      )}
      <ToggleRow
        label={t('fediverse.toggles.enableActivityPub.label')}
        description={t('fediverse.toggles.enableActivityPub.desc')}
        checked={draft.activityPub.enabled}
        disabled={activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, enabled: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.discoverableActor.label')}
        description={t('fediverse.toggles.discoverableActor.desc')}
        checked={draft.activityPub.discoverable}
        disabled={!draft.activityPub.enabled || activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, discoverable: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.exposeProfile.label')}
        description={t('fediverse.toggles.exposeProfile.desc')}
        checked={draft.activityPub.exposeProfile}
        disabled={!draft.activityPub.enabled || activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, exposeProfile: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.exposePublicPosts.label')}
        description={t('fediverse.toggles.exposePublicPosts.desc')}
        checked={draft.activityPub.exposePublicPosts}
        disabled={!draft.activityPub.enabled || activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, exposePublicPosts: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showWebsiteInActor.label')}
        description={t('fediverse.toggles.showWebsiteInActor.desc')}
        checked={draft.activityPub.showWebsiteInActor}
        disabled={!draft.activityPub.enabled || activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, showWebsiteInActor: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showSocialLinksInActor.label')}
        description={t('fediverse.toggles.showSocialLinksInActor.desc')}
        checked={draft.activityPub.showSocialLinksInActor}
        disabled={!draft.activityPub.enabled || activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, showSocialLinksInActor: value } })}
      />
      <ToggleRow
        label={t('fediverse.toggles.showLocationInActor.label')}
        description={t('fediverse.toggles.showLocationInActor.desc')}
        checked={draft.activityPub.showLocationInActor}
        disabled={!draft.activityPub.enabled || activityPubBlockedByVisibility}
        onChange={(value) => updateDraft({ ...draft, activityPub: { ...draft.activityPub, showLocationInActor: value } })}
      />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
        {t('fediverse.verification')}
      </div>
      <ToggleRow
        label={t('fediverse.toggles.relMeLinks.label')}
        description={t('fediverse.toggles.relMeLinks.desc')}
              checked={draft.verification.relMeLinks}
              onChange={(value) => updateDraft({ ...draft, verification: { relMeLinks: value } })}
            />
          </div>

      <div className="rounded-xl border p-4 text-xs text-gray-500 dark:text-gray-400">
        <p>{t('fediverse.consentStatus', { status: hasConsent ? t('fediverse.consentGranted') : t('fediverse.consentNotGranted') })}</p>
        <p className="mt-1">{consentAt ? t('fediverse.firstConsentRecorded', { date: new Date(consentAt).toLocaleString(dateTimeLocale) }) : t('fediverse.firstConsentNotRecorded')}</p>
      </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">{error}</div>}
          {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300">{message}</div>}

          <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving} disabled={!isDirty}>
          {t('fediverse.saveButton')}
        </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const getDefaultFediverseSettings = () => DEFAULT_FEDIVERSE_SETTINGS;
