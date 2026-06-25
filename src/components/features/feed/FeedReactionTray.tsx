'use client';

import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  BookOpenIcon,
  EarIcon,
  HandHeartIcon,
  LeafIcon,
  NetworkIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import {
  FEED_REACTION_LABELS,
  FEED_REACTION_TYPES,
  type FeedReactionGroup,
  type FeedReactionType,
} from '@/lib/feed-reactions';
import { Tooltip } from '@/components/ui/Tooltip';
import { getFeedPostReactionDetailsAction, toggleFeedCommentReactionAction, toggleFeedPostReactionAction } from '@/app/actions/feed';

const ICONS: Record<FeedReactionType, ComponentType<{ className?: string }>> = {
  INSPIRED: SparklesIcon,
  LEARNED: BookOpenIcon,
  CAN_HELP: HandHeartIcon,
  CAN_CONNECT: NetworkIcon,
  WORTH_DEEPER_LISTENING: EarIcon,
  REGENERATIVE: LeafIcon,
};

const REACTION_COLORS: Record<FeedReactionType, { inactive: string; active: string }> = {
  INSPIRED:                { inactive: 'text-amber-500 hover:border-amber-300 hover:bg-amber-50 dark:text-amber-400',   active: 'border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-300' },
  LEARNED:                 { inactive: 'text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:text-blue-400',       active: 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300' },
  CAN_HELP:                { inactive: 'text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:text-rose-400',       active: 'border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-300' },
  CAN_CONNECT:             { inactive: 'text-violet-500 hover:border-violet-300 hover:bg-violet-50 dark:text-violet-400', active: 'border-violet-400 bg-violet-50 text-violet-600 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-300' },
  WORTH_DEEPER_LISTENING:  { inactive: 'text-teal-500 hover:border-teal-300 hover:bg-teal-50 dark:text-teal-400',      active: 'border-teal-400 bg-teal-50 text-teal-600 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300' },
  REGENERATIVE:            { inactive: 'text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400', active: 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300' },
};

interface FeedReactionTrayProps {
  targetId: string;
  target: 'post' | 'comment';
  initialReactions?: Array<{ type: FeedReactionType }>;
}

export function FeedReactionTray({ targetId, target, initialReactions = [] }: Readonly<FeedReactionTrayProps>) {
  const { t } = useTranslation(['feed', 'common']);
  const [activeTypes, setActiveTypes] = useState<Set<FeedReactionType>>(
    () => new Set(initialReactions.map((reaction) => reaction.type)),
  );
  const [pendingType, setPendingType] = useState<FeedReactionType | null>(null);

  // Re-sync from server-provided reactions when they change. The feed renders
  // anonymous/public-only on SSR (no per-viewer reactions) and the client
  // refetches personalized data once the viewer is authenticated; the useState
  // initializer above only runs on mount, so without this the viewer's own
  // reactions would never appear after a reload. Skip while a toggle is in
  // flight so an optimistic update is never clobbered.
  // RCA: docs/errors/2026-06/20260613-feed-ssr-reactions-lost-on-reload.md
  const initialKey = initialReactions
    .map((reaction) => reaction.type)
    .sort((a, b) => a.localeCompare(b))
    .join(',');
  const lastSyncedKey = useRef(initialKey);
  useEffect(() => {
    if (pendingType) return;
    if (lastSyncedKey.current === initialKey) return;
    lastSyncedKey.current = initialKey;
    setActiveTypes(new Set(initialReactions.map((reaction) => reaction.type)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey, pendingType]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [groups, setGroups] = useState<FeedReactionGroup[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const toggle = async (type: FeedReactionType) => {
    if (pendingType) return;
    const previous = new Set(activeTypes);
    const next = new Set(activeTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setActiveTypes(next);
    setPendingType(type);

    const result = target === 'post'
      ? await toggleFeedPostReactionAction(targetId, type)
      : await toggleFeedCommentReactionAction(targetId, type);

    if (!result.success || !result.data) {
      setActiveTypes(previous);
    } else {
      const confirmed = new Set(previous);
      if (result.data.active) confirmed.add(result.data.type);
      else confirmed.delete(result.data.type);
      setActiveTypes(confirmed);
    }
    setPendingType(null);
  };

  const openDetails = async () => {
    if (target !== 'post') return;
    setDetailsOpen(true);
    setDetailsLoading(true);
    const result = await getFeedPostReactionDetailsAction(targetId);
    if (result.success && result.data) {
      setGroups(result.data.groups);
    }
    setDetailsLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={`${target}-reaction-tray`}>
      {FEED_REACTION_TYPES.map((type) => {
        const Icon = ICONS[type];
        const active = activeTypes.has(type);
        const label = t(`reactions.labels.${type}`, FEED_REACTION_LABELS[type]);
        return (
          <Tooltip key={type} content={label}>
            <button
              type="button"
              data-testid={`${target}-reaction-${type}`}
              aria-pressed={active}
              aria-label={label}
              disabled={pendingType !== null}
              onClick={() => void toggle(type)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border font-medium transition-colors ${
                active
                  ? REACTION_COLORS[type].active
                  : `border-gray-200 dark:border-gray-700 ${REACTION_COLORS[type].inactive}`
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          </Tooltip>
        );
      })}
      {target === 'post' && (
        <button
          type="button"
          data-testid="post-reaction-details-button"
          onClick={() => void openDetails()}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:text-emerald-700 dark:text-gray-400"
        >
          <UsersIcon className="h-3.5 w-3.5" />
          <span>{t('post.reactionDetails', 'Details')}</span>
        </button>
      )}

      {detailsOpen && (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailsOpen(false)}>
          <section // NOSONAR(S6819) — role="dialog"+aria-modal kept; native dialog relies on showModal()/close() which jsdom does not implement, breaking modal tests — focus/Esc handled in JS
            role="dialog"
            aria-label={t('post.reactionDetailsTitle', 'Reaction details')}
            data-testid="post-reaction-details-dialog"
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('post.reactionDetailsTitle', 'Reaction details')}</h2>
              <button type="button" className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" onClick={() => setDetailsOpen(false)}>
                {t('common:actions.close', 'Close')}
              </button>
            </div>
            {detailsLoading ? (
              <p className="text-sm text-gray-500">{t('common:actions.loading', 'Loading...')}</p>
            ) : (
              <div className="space-y-4">
                {groups.filter((group) => group.count > 0).map((group) => (
                  <div key={group.type}>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{group.label} ({group.count})</h3>
                    <div className="space-y-1.5">
                      {group.users.map((reactionUser) => (
                        <Link
                          key={`${group.type}-${reactionUser.id}`}
                          href={`/profile/${reactionUser.id}`}
                          className="block rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          {reactionUser.displayName || reactionUser.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                {groups.every((group) => group.count === 0) && (
                  <p className="text-sm text-gray-500">{t('post.noReactionsYet', 'No reactions yet.')}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
