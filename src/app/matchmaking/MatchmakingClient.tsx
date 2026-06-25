'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { UserIcon, UsersIcon, CalendarIcon, AlertCircleIcon, AwardIcon } from 'lucide-react';
import { ConnectButtonClient } from '@/components/features/connections/ConnectButtonClient';
import { useTransition } from 'react';
import { MatchResult, dismissMatch } from '@/app/actions/matchmaking';
import { ActiveBadge } from '@/components/ui/ActiveBadge';

interface MatchmakingClientProps {
  users: Record<string, MatchResult[]>;
  communities: MatchResult[];
  causes: MatchResult[];
  error?: string;
}

export function MatchmakingClient({ users, communities, causes, error }: Readonly<MatchmakingClientProps>) {
  const { t } = useTranslation('common');

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg flex items-center gap-3">
          <AlertCircleIcon className="w-6 h-6" />
          <div>
            <h2 className="font-semibold text-lg">{t('matchmaking.errorTitle')}</h2>
            <p>{error.startsWith('matchmaking.') ? t(error) : error}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyMatches = Object.values(users).some(arr => arr.length > 0) || communities.length > 0 || causes.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
            {t('matchmaking.title')}
          </span>
        </h1>
        <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('matchmaking.description')}
        </p>
        <div className="mt-5 mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100" role="note">
          <p className="font-semibold">{t('matchmaking.scoreTransparencyTitle')}</p>
          <p className="mt-1">{t('matchmaking.scoreTransparencyBody')}</p>
        </div>
      </header>

      {hasAnyMatches ? (
        <div className="space-y-16">
          <div className="space-y-10">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
              <UserIcon className="w-8 h-8 text-emerald-600" />
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('matchmaking.connections')}</h2>
            </div>
            <RelationshipGroup title={t('matchmaking.complementarySymmetric')} data={users.COMPLEMENTARY_SYMMETRIC} resultsLabel={t('matchmaking.results')} />
            <RelationshipGroup title={t('matchmaking.complementaryAsymmetric')} data={users.COMPLEMENTARY_ASYMMETRIC} resultsLabel={t('matchmaking.results')} />
            <RelationshipGroup title={t('matchmaking.fellowTraveller')} data={users.FELLOW_TRAVELLER} resultsLabel={t('matchmaking.results')} />
            <RelationshipGroup title={t('matchmaking.peer')} data={users.PEER} resultsLabel={t('matchmaking.results')} />
            <RelationshipGroup title={t('matchmaking.mentorMentee')} data={users.MENTOR_MENTEE} resultsLabel={t('matchmaking.results')} />
            <RelationshipGroup title={t('matchmaking.otherConnections')} data={users.OTHER} resultsLabel={t('matchmaking.results')} />
          </div>

          {communities.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                <UsersIcon className="w-8 h-8 text-teal-600" />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('matchmaking.communities')}</h2>
                <span className="bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-teal-900 dark:text-teal-300">
                  {communities.length} {t('matchmaking.recommendations')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map(comm => (
                  <MatchCard key={comm.id} match={comm} />
                ))}
              </div>
            </section>
          )}

          {causes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('matchmaking.sharedCauses')}</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                  {causes.length} {t('matchmaking.recommendations')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {causes.map(cause => (
                  <MatchCard key={cause.id} match={cause} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('matchmaking.noMatchesTitle')}</h3>
          <p className="mt-1 text-gray-500 max-w-md mx-auto">
            {t('matchmaking.noMatchesDesc')}
          </p>
        </div>
      )}
    </div>
  );
}

function RelationshipGroup({ title, data, resultsLabel }: Readonly<{ title: string; data?: MatchResult[]; resultsLabel: string }>) {
  if (!data || data.length === 0) return null;
  return (
    <section className="bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        {title}
        <span className="text-sm font-normal text-gray-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
          {data.length} {resultsLabel}
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(user => (
          <MatchCard key={user.id} match={user} />
        ))}
      </div>
    </section>
  );
}

type MatchReasonItem = {
  key: string;
  count?: number;
  localized: boolean;
};

function MatchCardDismissButton({ matchId }: Readonly<{ matchId: string }>) {
  const { t } = useTranslation('common');
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => { void dismissMatch(matchId); })}
      className="w-full text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 py-1 transition-colors disabled:opacity-50"
      aria-label={t('matchmaking.dismissLabel')}
    >
      {isPending ? '…' : t('matchmaking.dismissLabel')}
    </button>
  );
}

function MatchCard({ match }: Readonly<{ match: MatchResult }>) {
  const { t } = useTranslation('common');
  const reasonItems: MatchReasonItem[] = match.matchReasonTokens?.length
    ? match.matchReasonTokens.map(reason => ({ ...reason, localized: true }))
    : match.matchReasons.map(reason => ({ key: reason, localized: false }));

  const content = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1">
              {match.title}
            </h3>
            <ActiveBadge show={match.type === 'USER' && match.isRecentlyActive} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
            {match.subtitle || ' '}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center flex-shrink-0 ml-3 dark:bg-emerald-900/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 transition-colors" aria-label={t('matchmaking.scoreAria', { score: match.score })}>
          <AwardIcon className="w-4 h-4 mb-0.5" />
          <span className="text-xs font-bold leading-none">{match.score.toString().replace('.0', '')}</span>
        </div>
      </div>

      <details className="mb-4 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
        <summary className="cursor-pointer font-medium">{t('matchmaking.scoreDisclosureTitle')}</summary>
        <p className="mt-2">{t('matchmaking.scoreDisclosureBody')}</p>
      </details>

      {reasonItems.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-700/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest dark:text-gray-500">{t('matchmaking.whyGoodMatch')}</p>
          <div className="flex flex-wrap gap-2">
            {reasonItems.map((reason) => {
              const label = reason.localized
                ? t(`matchmaking.reasons.${reason.key}`, { count: reason.count })
                : reason.key;
              return (
                <span key={`${reason.key}-${reason.count ?? ''}`} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all h-full flex flex-col dark:bg-gray-800 dark:border-gray-700 group">
      {match.link ? (
        <Link href={match.link} className="p-5 flex-grow block">
          {content}
        </Link>
      ) : (
        <div className="p-5 flex-grow">
          {content}
        </div>
      )}

      {match.type === 'USER' && (
        <div className="p-4 pt-0 mt-auto space-y-3">
          <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-100">
            <p className="font-semibold">{t('matchmaking.firstExchangeTitle')}</p>
            <p className="mt-1">{t('matchmaking.firstExchangeBody')}</p>
          </div>
          <ConnectButtonClient
            targetId={match.id}
            targetName={match.title}
            relationshipCategory={match.category || 'OTHER'}
          />
          <MatchCardDismissButton matchId={match.id} />
        </div>
      )}
    </div>
  );
}
