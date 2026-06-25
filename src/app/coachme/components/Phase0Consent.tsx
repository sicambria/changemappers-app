'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { saveConsent, saveEncryptionConfig, verifyAccountPassword } from '@/app/actions/coachme';
import { setupEncryption } from '@/lib/coachme-crypto';
import type { CoachMeEncryptionModel } from '@/lib/coachme-crypto';

interface Phase0ConsentProps {
  onComplete: (key: CryptoKey) => void;
}

const CONSENT_CHECKS = [
  { id: 'check1', labelKey: 'phases.consent.checkbox1' },
  { id: 'check2', labelKey: 'phases.consent.checkbox2' },
  { id: 'check3', labelKey: 'phases.consent.checkbox3' },
  { id: 'check4', labelKey: 'phases.consent.checkbox4' },
] as const;

export function Phase0Consent({ onComplete }: Readonly<Phase0ConsentProps>) {
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const router = useRouter();

  const [checks, setChecks] = useState({
    check1: false,
    check2: false,
    check3: false,
    check4: false,
  });
  const [encryptionModel, setEncryptionModel] = useState<CoachMeEncryptionModel>('RECOVERABLE');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = checks.check1 && checks.check2 && checks.check3 && checks.check4;

  const handleSubmit = useCallback(async () => {
    if (!allChecked) return;

    const requiresAccountPassword = encryptionModel === 'STRONG';

    if (requiresAccountPassword && password.length < 1) {
      setError(tRef.current('phases.consent.errors.passwordEmpty'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (requiresAccountPassword) {
        const verifyResult = await verifyAccountPassword(password);
        if (!verifyResult.success) {
          setError(verifyResult.error || tRef.current('phases.consent.errors.wrongPassword'));
          setIsSubmitting(false);
          return;
        }
      }

      const consentResult = await saveConsent();
      if (!consentResult.success) {
        setError(tRef.current('phases.consent.errors.saveFailed'));
        setIsSubmitting(false);
        return;
      }

      const encryptionPassword = requiresAccountPassword ? password : '';
      const { salt, encryptedDek, key } = await setupEncryption(encryptionPassword, encryptionModel);

      const configResult = await saveEncryptionConfig({
        encryptionModel,
        encryptionSalt: salt,
        encryptedDek,
      });

      if (!configResult.success) {
        setError(tRef.current('phases.consent.errors.saveFailed'));
        setIsSubmitting(false);
        return;
      }

      onComplete(key);
    } catch {
      setError(tRef.current('phases.consent.errors.saveFailed'));
      setIsSubmitting(false);
    }
  }, [allChecked, password, encryptionModel, onComplete]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.consent.title')}
      </h1>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          {t('phases.consent.statement1')}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          {t('phases.consent.statement2')}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          {t('phases.consent.statement3')}
        </div>
      </div>

      <div className="space-y-3">
        {CONSENT_CHECKS.map((check) => (
          <label key={check.id} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[check.id]}
              onChange={(e) => setChecks((c) => ({ ...c, [check.id]: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t(check.labelKey)}
            </span>
          </label>
        ))}
      </div>

      {/* Encryption model choice */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('phases.consent.encryption.title')}
        </h2>

        <label // NOSONAR(S6853) — implicit label/control association; the accessible name is computed from descendant text per the accname spec, which Sonar's depth-2 traversal misses
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 ${
          encryptionModel === 'RECOVERABLE'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <input
            type="radio"
            name="encryptionModel"
            value="RECOVERABLE"
            checked={encryptionModel === 'RECOVERABLE'}
            onChange={() => setEncryptionModel('RECOVERABLE')}
            className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {t('phases.consent.encryption.recoverableTitle')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('phases.consent.encryption.recoverableDesc')}
            </div>
          </div>
        </label>

        <label // NOSONAR(S6853) — implicit label/control association; the accessible name is computed from descendant text per the accname spec, which Sonar's depth-2 traversal misses
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 ${
          encryptionModel === 'STRONG'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <input
            type="radio"
            name="encryptionModel"
            value="STRONG"
            checked={encryptionModel === 'STRONG'}
            onChange={() => setEncryptionModel('STRONG')}
            className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {t('phases.consent.encryption.strongTitle')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('phases.consent.encryption.strongDesc')}
            </div>
          </div>
        </label>
      </div>

      {encryptionModel === 'STRONG' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('phases.consent.encryption.accountPasswordTitle')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('phases.consent.encryption.accountPasswordDesc')}
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('phases.consent.encryption.accountPasswordPlaceholder')}
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!allChecked || isSubmitting}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '...' : t('phases.consent.startButton')}
        </button>
        <button
          onClick={() => router.push('/reflect')}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t('phases.consent.exitButton')}
        </button>
      </div>
    </div>
  );
}

export function ReturningUserGate({
  agreeTo = '/coachme',
  exitTo = '/reflect',
}: Readonly<{
  agreeTo?: string;
  exitTo?: string;
}>) {
  const { t } = useTranslation('coachme');
  const router = useRouter();
  const [showFull, setShowFull] = useState(false);

  if (showFull) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            {t('phases.consent.statement1')}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            {t('phases.consent.statement2')}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            {t('phases.consent.statement3')}
          </div>
        </div>
        <button onClick={() => setShowFull(false)} className="text-sm text-emerald-600 hover:underline">
          Back to summary
        </button>
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => router.push(agreeTo)}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            {t('phases.consent.returningButton')}
          </button>
          <button
            onClick={() => router.push(exitTo)}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('phases.consent.exitButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.consent.returningTitle')}
      </h1>
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
        {t('phases.consent.returningSummary')}
      </div>
      <button onClick={() => setShowFull(true)} className="text-sm text-emerald-600 hover:underline">
        {t('phases.consent.readFullLink')}
      </button>
      <div className="flex gap-4 pt-4">
        <button
          onClick={() => router.push(agreeTo)}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          {t('phases.consent.returningButton')}
        </button>
        <button
          onClick={() => router.push(exitTo)}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t('phases.consent.exitButton')}
        </button>
      </div>
    </div>
  );
}
