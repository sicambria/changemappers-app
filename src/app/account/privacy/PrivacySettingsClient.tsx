'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import {
  toggleProcessingRestrictedAction,
  toggleAlgorithmicMatchingAction,
  withdrawSpecialCategoryConsentAction,
  scheduleAccountDeletionAction,
  cancelScheduledDeletionAction,
} from '@/app/actions/user';

function handleCookieSettings() {
  globalThis.dispatchEvent(new CustomEvent('open-cookie-settings'));
}

interface Props {
  userId: string;
  processingRestricted: boolean;
  declineAlgorithmicMatching: boolean;
  allowSensitiveMatching: boolean;
  specialCategoryConsentAt: string | null;
  specialCategoryConsentWithdrawnAt: string | null;
  scheduledDeletionAt: string | null;
}

export function PrivacySettingsClient({
  userId,
  processingRestricted: initialProcessingRestricted,
  declineAlgorithmicMatching: initialDeclineMatching,
  allowSensitiveMatching: initialSensitiveMatching,
  specialCategoryConsentAt,
  specialCategoryConsentWithdrawnAt,
  scheduledDeletionAt,
}: Readonly<Props>) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const deleteKeyword = t('privacy.deletion.confirmKeyword');
  const [processingRestricted, setProcessingRestricted] = useState(initialProcessingRestricted);
  const [declineMatching, setDeclineMatching] = useState(initialDeclineMatching);
  const [allowSensitiveMatching, setAllowSensitiveMatching] = useState(initialSensitiveMatching);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  async function handleProcessingRestricted(restrict: boolean) {
    setSaving(true);
    setMessage('');
    setStatusError('');
    const result = await toggleProcessingRestrictedAction(userId, restrict);
    if (result.success) {
      setProcessingRestricted(restrict);
      setMessage(result.message ?? t('privacy.processing.saved'));
    } else {
      setStatusError(result.error ?? t('errors.generic'));
    }
    setSaving(false);
  }

  async function handleDeclineMatching(decline: boolean) {
    setSaving(true);
    setMessage('');
    setStatusError('');
    const result = await toggleAlgorithmicMatchingAction(userId, decline);
    if (result.success) {
      setDeclineMatching(decline);
      setMessage(result.message ?? t('privacy.matching.saved'));
    } else {
      setStatusError(result.error ?? t('errors.generic'));
    }
    setSaving(false);
  }

  async function handleWithdrawSensitiveConsent() {
    setSaving(true);
    setMessage('');
    setStatusError('');
    const result = await withdrawSpecialCategoryConsentAction(userId);
    if (result.success) {
      setAllowSensitiveMatching(false);
      setDeclineMatching(true);
      setMessage(result.message ?? t('privacy.matching.sensitiveWithdrawn'));
      router.refresh();
    } else {
      setStatusError(result.error ?? t('errors.generic'));
    }
    setSaving(false);
  }

  async function handleScheduleDeletion() {
    if (deleteConfirm !== deleteKeyword) {
      setStatusError(t('privacy.deleteConfirmationRequired'));
      return;
    }
    setSaving(true);
    setMessage('');
    setStatusError('');
    const result = await scheduleAccountDeletionAction(userId, deleteConfirm);
    if (result.success) {
      setMessage(result.message ?? t('privacy.deletion.scheduledMessage'));
      setDeleteConfirm('');
      setShowDeleteForm(false);
      router.refresh();
    } else {
      setStatusError(result.error ?? t('errors.generic'));
    }
    setSaving(false);
  }

  async function handleCancelDeletion() {
    setSaving(true);
    setMessage('');
    setStatusError('');
    const result = await cancelScheduledDeletionAction(userId);
    if (result.success) {
      setMessage(result.message ?? t('privacy.deletion.cancelled'));
      router.refresh();
    } else {
      setStatusError(result.error ?? t('errors.generic'));
    }
    setSaving(false);
  }

  const scheduledDate = scheduledDeletionAt
    ? new Date(scheduledDeletionAt).toLocaleDateString(i18n.language)
    : null;
  const deletionRequirementsId = 'privacy-delete-requirements';
  const deletionRequirements = [
    deleteConfirm !== deleteKeyword ? t('actionRequirements.typeDeleteKeyword', { keyword: deleteKeyword }) : null,
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      {message && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          {message}
        </div>
      )}
      {statusError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {statusError}
        </div>
      )}

      {/* Art. 18 — Processing restriction */}
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">{t('privacy.processing.title')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('privacy.processing.description')}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleProcessingRestricted(!processingRestricted)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              processingRestricted ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={processingRestricted}
            aria-label={t('privacy.processing.aria')}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                processingRestricted ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium">
            {processingRestricted ? t('privacy.processing.active') : t('privacy.processing.inactive')}
          </span>
        </div>
      </section>

      {/* Art. 22 — Algorithmic matching opt-out */}
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">{t('privacy.matching.title')}</h2>
        <p className="text-sm text-gray-600 mb-3">
          {t('privacy.matching.description')}
        </p>
        <p className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          {t('privacy.matching.profileVisibilityNote')}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleDeclineMatching(!declineMatching)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              declineMatching ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={declineMatching}
            aria-label={t('privacy.matching.aria')}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                declineMatching ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium">
            {declineMatching ? t('privacy.matching.disabled') : t('privacy.matching.enabled')}
          </span>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">{t('privacy.roleLabels.title')}</h2>
        <p className="text-sm text-gray-600 mb-3">
          {t('privacy.roleLabels.description')}
        </p>
        <p className="text-xs text-gray-500">
          {t('privacy.roleLabels.currentControl')}
        </p>
      </section>

      {/* Art. 15 — Right of access */}
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">{t('privacy.export.title')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('privacy.export.description')}
        </p>
        <a
          href="/api/gdpr/export"
          className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('privacy.export.download')}
        </a>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">{t('privacy.cookies.title')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('privacy.cookies.description')}
        </p>
        <button
          type="button"
          onClick={handleCookieSettings}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {t('privacy.cookies.open')}
        </button>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">{t('privacy.matching.sensitiveTitle')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {allowSensitiveMatching
            ? t('privacy.matching.sensitiveActive')
            : t('privacy.matching.sensitiveInactive')}
        </p>
        {specialCategoryConsentAt && !specialCategoryConsentWithdrawnAt && (
          <p className="mb-4 text-xs text-gray-500">
            {t('privacy.matching.sensitiveAcceptedAt')}: {new Date(specialCategoryConsentAt).toLocaleDateString(i18n.language)}
          </p>
        )}
        <button
          type="button"
          disabled={saving || !allowSensitiveMatching}
          onClick={handleWithdrawSensitiveConsent}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        >
          {t('privacy.matching.withdrawSensitive')}
        </button>
      </section>

      {/* Art. 17 — Right to erasure */}
      <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-700 mb-1">{t('privacy.deletion.title')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('privacy.deletion.descriptionPre')} <strong>{t('privacy.deletion.descriptionStrong')}</strong> {t('privacy.deletion.descriptionPost')}
        </p>

        {(() => {
        if (scheduledDate) return (
          <div className="space-y-3">
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
              {t('privacy.deletion.scheduled', { date: scheduledDate })}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleCancelDeletion}
              className="rounded-md bg-white border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {t('privacy.deletion.cancel')}
            </button>
          </div>
        );
        if (showDeleteForm) return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              {t('privacy.deletion.confirmPrompt')} <strong className="text-red-600">{deleteKeyword}</strong>
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={deleteKeyword}
              aria-label={t('privacy.deletion.aria')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <ActionRequirements id={deletionRequirementsId} requirements={deletionRequirements} />
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving || deleteConfirm !== deleteKeyword}
                aria-describedby={deletionRequirements.some(Boolean) ? deletionRequirementsId : undefined}
                onClick={handleScheduleDeletion}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {saving ? t('privacy.deletion.processing') : t('privacy.deletion.schedule')}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteForm(false); setDeleteConfirm(''); setStatusError(''); }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {t('privacy.deletion.nevermind')}
              </button>
            </div>
          </div>
        );
        return (
          <button
            type="button"
            onClick={() => setShowDeleteForm(true)}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {t('privacy.deletion.request')}
          </button>
        );
        })()}
      </section>
    </div>
  );
}
