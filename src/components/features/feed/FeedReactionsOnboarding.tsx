'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpenIcon,
  EarIcon,
  HandHeartIcon,
  LeafIcon,
  NetworkIcon,
  SparklesIcon,
} from 'lucide-react';
import { FEED_REACTION_LABELS, FEED_REACTION_TYPES, type FeedReactionType } from '@/lib/feed-reactions';
import { getFeedReactionsOnboardingStorageKey } from '@/lib/feed-reactions-onboarding';

const ICONS: Record<FeedReactionType, ComponentType<{ className?: string }>> = {
  INSPIRED: SparklesIcon,
  LEARNED: BookOpenIcon,
  CAN_HELP: HandHeartIcon,
  CAN_CONNECT: NetworkIcon,
  WORTH_DEEPER_LISTENING: EarIcon,
  REGENERATIVE: LeafIcon,
};

const COLORS: Record<FeedReactionType, string> = {
  INSPIRED: 'text-amber-500',
  LEARNED: 'text-blue-500',
  CAN_HELP: 'text-rose-500',
  CAN_CONNECT: 'text-violet-500',
  WORTH_DEEPER_LISTENING: 'text-teal-500',
  REGENERATIVE: 'text-emerald-500',
};

interface FeedReactionsOnboardingProps {
  userId: string | null | undefined;
}

export function FeedReactionsOnboarding({ userId }: Readonly<FeedReactionsOnboardingProps>) {
  const { t } = useTranslation(['feed', 'common']);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = getFeedReactionsOnboardingStorageKey(userId);
    if (globalThis.localStorage.getItem(key) !== 'true') {
      setOpen(true);
    }
  }, [userId]);

  const dismiss = () => {
    if (userId) {
      globalThis.localStorage.setItem(getFeedReactionsOnboardingStorageKey(userId), 'true');
    }
    setOpen(false);
  };

  if (!open || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="feed-reactions-onboarding">
      <section // NOSONAR(S6819) — role="dialog"+aria-modal kept; native dialog relies on showModal()/close() which jsdom does not implement, breaking modal tests — focus/Esc handled in JS
        role="dialog" aria-label={t('onboarding.feedReactionsTitle', 'Feed reactions')} className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl dark:bg-gray-900">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('onboarding.feedReactionsTitle', 'Feed reactions')}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t('onboarding.feedReactionsCopy', 'Use reactions to name what a post offers, and add RDGs or curated tags when they help people find context.')}
            </p>
          </div>
          <button type="button" onClick={dismiss} className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
            {t('common:actions.close', 'Close')}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FEED_REACTION_TYPES.map((type) => {
            const Icon = ICONS[type];
            const color = COLORS[type];
            const label = t(`reactions.labels.${type}`, FEED_REACTION_LABELS[type]);
            return (
              <div
                key={type}
                data-testid={`feed-onboarding-reaction-${type}`}
                title={label}
                className="flex flex-col items-center gap-1.5 rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <Icon className={`h-7 w-7 ${color}`} />
                <span className="text-xs text-center text-gray-600 dark:text-gray-300">{label}</span>
              </div>
            );
          })}
        </div>
        <button data-testid="feed-onboarding-got-it" type="button" onClick={dismiss} className="mt-4 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t('onboarding.feedReactionsDone', 'Got it')}
        </button>
      </section>
    </div>
  );
}
