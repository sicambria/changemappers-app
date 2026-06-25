'use client';

// ArchiveOfferButton — soft-delete (archive) affordance for a growth/coaching offer.
// AUDIT-20260613-024: growth surfaces had no destructive flow despite existing
// archive*OfferAction server actions. Inline two-step confirm follows the
// BlockUserButton precedent (no native confirm(), no modal dependency).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { archiveCoachingOfferAction } from '@/app/actions/coaching';
import { archiveTrainingOfferAction } from '@/app/actions/training';
import { archiveMentorProfileAction } from '@/app/actions/mentoring';
import { archivePeerSupportOfferAction } from '@/app/actions/peer';
import type { GrowthModality } from '@/types/growth-hub';
import type { ApiResponse } from '@/types/modalities';

interface ArchiveOfferButtonProps {
  modality: GrowthModality;
  offerId: string;
  /** Called after a successful archive; defaults to router.refresh(). */
  onArchived?: () => void;
}

const archiveActionByModality: Record<
  GrowthModality,
  (id: string) => Promise<ApiResponse<void>>
> = {
  COACH: archiveCoachingOfferAction,
  TRAINING: archiveTrainingOfferAction,
  MENTOR: archiveMentorProfileAction,
  PEER: archivePeerSupportOfferAction,
};

export function ArchiveOfferButton({ modality, offerId, onArchived }: Readonly<ArchiveOfferButtonProps>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setPending(true);
    setError(null);
    const action = archiveActionByModality[modality];
    const result = await action(offerId);
    setPending(false);

    if (!result.success) {
      setError(result.error ?? t('actions.archiveFailed'));
      return;
    }

    setConfirming(false);
    if (onArchived) {
      onArchived();
    } else {
      router.refresh();
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error ? (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        ) : (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('actions.confirmArchive')}
          </span>
        )}
        <button
          type="button"
          onClick={handleArchive}
          disabled={pending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
        >
          {pending ? t('actions.archiving') : t('actions.confirmYes')}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
          className="text-sm text-gray-500 hover:underline disabled:opacity-50 dark:text-gray-400"
        >
          {t('actions.cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-gray-500 hover:text-red-600 hover:underline dark:text-gray-400 dark:hover:text-red-400"
      >
        {t('actions.archive')}
      </button>
    </div>
  );
}
