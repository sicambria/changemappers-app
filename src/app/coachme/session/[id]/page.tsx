'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { deleteSession, getSession, updateSessionPhase, getEncryptionConfig } from '@/app/actions/coachme';
import {
  PhaseContainer,
  Phase1Focus,
  Phase2Miracle,
  Phase3Scaling,
  Phase6Action,
  Phase8Synthesis,
  PauseForSupport,
} from '@/app/coachme/components';
import {
  unlockEncryption,
  encryptSessionFields,
  decryptSessionFields,
} from '@/lib/coachme-crypto';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import type { CoachMeSession } from '@/lib/prisma-shared';
import type { CoachMeEncryptionModel } from '@/lib/coachme-crypto';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const sessionId = params.id as string;

  const [session, setSession] = useState<CoachMeSession | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [encryptionConfig, setEncryptionConfig] = useState<{
    model: CoachMeEncryptionModel;
    salt: string;
    encryptedDek: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPause, setShowPause] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStartingOver, setIsStartingOver] = useState(false);
  const [returnPhaseAfterStartEdit, setReturnPhaseAfterStartEdit] = useState<number | null>(null);

  // Unlock form state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const unlockRequirementsId = 'coachme-unlock-requirements';
  const unlockRequirements = [
    unlockPassword.length < 1 ? t('common:actionRequirements.enterPassword') : null,
  ];

  const decryptAndSetSession = useCallback(
    async (raw: CoachMeSession, key: CryptoKey) => {
      const decrypted = await decryptSessionFields(raw as unknown as Record<string, unknown>, key);
      setSession(decrypted as unknown as CoachMeSession);
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const [sessionRes, configRes] = await Promise.all([
        getSession(sessionId),
        getEncryptionConfig(),
      ]);

      if (!sessionRes.success || !sessionRes.data) {
        setError(sessionRes.error || tRef.current('errors.sessionNotFound'));
        setLoading(false);
        return;
      }

      if (!configRes.success || !configRes.data) {
        setError(tRef.current('errors.encryptionNotConfigured'));
        setLoading(false);
        return;
      }

      const config = {
        model: configRes.data.encryptionModel as CoachMeEncryptionModel,
        salt: configRes.data.encryptionSalt,
        encryptedDek: configRes.data.encryptedDek,
      };

      setEncryptionConfig(config);

      if (config.model === 'RECOVERABLE') {
        try {
          const key = await unlockEncryption('', config.salt, config.encryptedDek, config.model);
          setEncryptionKey(key);
          await decryptAndSetSession(sessionRes.data as CoachMeSession, key);
        } catch {
          setError(tRef.current('errors.recoverableUnlockFailed'));
        }
        setLoading(false);
        return;
      }

      // Store raw encrypted session; we'll decrypt after unlock
      setSession(sessionRes.data as CoachMeSession);
      setLoading(false);
    })();
  }, [sessionId, decryptAndSetSession]);

  const handleUnlock = useCallback(async () => {
    if (!encryptionConfig || !session) return;
    setUnlockError(null);
    setIsUnlocking(true);

    try {
      const key = await unlockEncryption(
        unlockPassword,
        encryptionConfig.salt,
        encryptionConfig.encryptedDek,
        encryptionConfig.model,
      );
      setEncryptionKey(key);
      await decryptAndSetSession(session, key);
    } catch {
      setUnlockError(tRef.current('unlock.wrongPassword'));
    } finally {
      setIsUnlocking(false);
    }
  }, [encryptionConfig, session, unlockPassword, decryptAndSetSession]);

  const handleSave = useCallback(
    async (data: Record<string, unknown>) => {
      if (!encryptionKey) return;
      const encrypted = await encryptSessionFields(data, encryptionKey);
      const result = await updateSessionPhase(sessionId, encrypted);
      if (result.success && result.data) {
        await decryptAndSetSession(result.data as CoachMeSession, encryptionKey);
        if (result.crisisDetected) setShowPause(true);
      }
    },
    [sessionId, encryptionKey, decryptAndSetSession],
  );

  const handleNavigate = useCallback(
    (action: string) => {
      if (!session) return;

      // Simplified phase map: 1 -> 2 -> 3 -> 6 -> 8
      const phaseMap: Record<string, number> = {
        next: session.currentPhase + 1,
        miracle: 2,
        review: session.currentPhase,
        end: 8,
      };

      let targetPhase = phaseMap[action];
      if (action === 'next' && session.currentPhase === 3) {
        targetPhase = 6;
      } else if (action === 'next' && session.currentPhase === 6) {
        targetPhase = 8;
      }

      if (action === 'end') {
        handleSave({ currentPhase: 8 });
      } else if (targetPhase !== undefined) {
        handleSave({ currentPhase: targetPhase });
      }
    },
    [session, handleSave],
  );

  const handleEndSession = useCallback(() => {
    router.push('/reflect');
  }, [router]);

  const handleStartOver = useCallback(async () => {
    if (!session) return;
    const confirmed = globalThis.confirm(tRef.current('restart.confirm'));
    if (!confirmed) return;

    setIsStartingOver(true);
    const result = await deleteSession(session.id);

    if (result.success) {
      router.push('/coachme/new');
      return;
    }

    setError(result.error || tRef.current('restart.error'));
    setIsStartingOver(false);
  }, [session, router]);

  const handleEditStart = useCallback(async () => {
    if (!session || session.currentPhase === 1) return;
    setReturnPhaseAfterStartEdit(session.currentPhase);
    await handleSave({ currentPhase: 1 });
  }, [session, handleSave]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t('common:coachmeSession.loading')}</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || t('common:coachmeSession.sessionNotFound')}</div>
      </div>
    );
  }

  // Show unlock screen until key is available
  if (!encryptionKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="text-4xl">🔒</div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('unlock.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('unlock.description')}
            </p>
          </div>

          <input
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder={t('unlock.accountPasswordPlaceholder')}
            autoFocus
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          {unlockError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {unlockError}
            </div>
          )}

          <ActionRequirements id={unlockRequirementsId} requirements={unlockRequirements} />

          <button
            onClick={handleUnlock}
            disabled={isUnlocking || unlockPassword.length < 1}
            aria-describedby={unlockRequirements.some(Boolean) ? unlockRequirementsId : undefined}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isUnlocking ? '...' : t('unlock.button')}
          </button>

          <button
            onClick={() => router.push('/coachme')}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t('unlock.cancel')}
          </button>
        </div>
      </div>
    );
  }

  const renderPhase = () => {
    switch (session.currentPhase) {
      case 1:
        return (
          <Phase1Focus
            session={session}
            onSave={handleSave}
            onNext={() => setReturnPhaseAfterStartEdit(null)}
            nextPhase={returnPhaseAfterStartEdit ?? 2}
          />
        );
      case 2:
        return (
          <Phase2Miracle
            session={session}
            onSave={handleSave}
            onNext={() => undefined}
            onNavigate={handleNavigate}
          />
        );
      case 3:
        return (
          <Phase3Scaling
            session={session}
            onSave={handleSave}
            onNext={() => undefined}
            onNavigate={handleNavigate}
          />
        );
      case 6:
        return (
          <Phase6Action
            session={session}
            onSave={handleSave}
            onNext={() => undefined}
            onNavigate={handleNavigate}
          />
        );
      case 8:
        return (
          <Phase8Synthesis
            session={session}
            onBack={() => handleSave({ currentPhase: 6 })}
          />
        );
      default:
        // Handle sessions that were mid-flow through removed phases (4,5,7)
        // by advancing them to the next active phase
        if (session.currentPhase >= 4 && session.currentPhase <= 5) {
          handleSave({ currentPhase: 6 });
        } else if (session.currentPhase === 7) {
          handleSave({ currentPhase: 8 });
        }
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-500">{t('common:coachmeSession.redirecting')}</div>
          </div>
        );
    }
  };

  return (
    <>
      <PhaseContainer
        session={session}
        onPause={() => setShowPause(true)}
        onStartOver={handleStartOver}
        onEditStart={handleEditStart}
        isStartingOver={isStartingOver}
      >
        {renderPhase()}
      </PhaseContainer>

      <PauseForSupport
        isOpen={showPause}
        onClose={() => setShowPause(false)}
        onEndSession={handleEndSession}
      />
    </>
  );
}
