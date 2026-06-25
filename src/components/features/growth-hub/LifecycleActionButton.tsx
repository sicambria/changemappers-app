'use client';

// LifecycleActionButton — generic inline two-step confirm for a single growth/coaching
// engagement/connection lifecycle action (accept / cancel / complete / close).
// AUDIT-20260613-024: the connections lists were read-only despite the overviews describing
// engagement acceptance. This generalizes the ArchiveOfferButton / BlockUserButton inline-confirm
// pattern (no native confirm(), no modal dependency) so each list can wire the existing
// server actions with a bound thunk and pre-translated, namespace-agnostic labels.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/types/modalities';

export interface LifecycleActionLabels {
  /** Resting button text, e.g. "Accept". */
  label: string;
  /** Confirmation prompt shown after first click, e.g. "Accept this request?". */
  confirmPrompt: string;
  /** Confirm-yes button text, e.g. "Yes, accept". */
  confirmYes: string;
  /** In-flight button text, e.g. "Accepting…". */
  pendingLabel: string;
  /** Cancel-the-confirm text, e.g. "Cancel". */
  cancelLabel: string;
  /** Fallback error message when the action returns no `error` string. */
  errorFallback: string;
}

interface LifecycleActionButtonProps {
  /** Bound server-action thunk; resolves to an ApiResponse. */
  action: () => Promise<ApiResponse<unknown>>;
  labels: LifecycleActionLabels;
  /** Visual tone: 'primary' for accept, 'danger' for cancel/close/complete. */
  tone?: 'primary' | 'danger';
  /** Called after a successful action; defaults to router.refresh(). */
  onDone?: () => void;
}

export function LifecycleActionButton({
  action,
  labels,
  tone = 'danger',
  onDone,
}: Readonly<LifecycleActionButtonProps>) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);

    if (!result.success) {
      setError(result.error ?? labels.errorFallback);
      return;
    }

    setConfirming(false);
    if (onDone) {
      onDone();
    } else {
      router.refresh();
    }
  }

  const restingClass =
    tone === 'primary'
      ? 'text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400'
      : 'text-sm text-gray-500 hover:text-red-600 hover:underline dark:text-gray-400 dark:hover:text-red-400';

  const confirmYesClass =
    tone === 'primary'
      ? 'text-sm font-medium text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400'
      : 'text-sm font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400';

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error ? (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </span>
        ) : (
          <span className="text-sm text-gray-600 dark:text-gray-400">{labels.confirmPrompt}</span>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className={confirmYesClass}
        >
          {pending ? labels.pendingLabel : labels.confirmYes}
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
          {labels.cancelLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      <button type="button" onClick={() => setConfirming(true)} className={restingClass}>
        {labels.label}
      </button>
    </div>
  );
}
