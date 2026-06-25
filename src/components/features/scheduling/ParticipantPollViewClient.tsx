'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Check, X, Minus, CheckCircle2, CalendarPlus } from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { submitVoteAction, getPollByParticipantTokenAction } from '@/app/actions/scheduling';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import type { AvailabilityVote } from '@/lib/prisma-shared';

type VoteState = 'AVAILABLE' | 'IF_NEEDED' | 'UNAVAILABLE';

interface TimeOption {
  id: string;
  startTime: Date;
  endTime: Date | null;
  sortOrder: number;
}

interface Response {
  id: string;
  participantName: string;
  votes: Array<{
    timeOptionId: string;
    vote: string;
  }>;
}

interface PollData {
  id: string;
  title: string;
  description: string | null;
  organizerName: string;
  location: string | null;
  timezone: string;
  confirmedTimeOptionId: string | null;
  confirmedAt: Date | null;
  timeOptions: TimeOption[];
  responses: Response[];
  hasUserVoted: boolean;
  userResponseId: string | null;
}

interface ParticipantPollViewClientProps {
  poll: PollData;
  participantToken: string;
}

const voteColors: Record<VoteState, string> = {
  AVAILABLE: 'bg-emerald-100 border-emerald-400 text-emerald-700',
  IF_NEEDED: 'bg-amber-100 border-amber-400 text-amber-700',
  UNAVAILABLE: 'bg-gray-100 border-gray-300 text-gray-500',
};

const voteIcons: Record<VoteState, React.ReactNode> = {
  AVAILABLE: <Check className="h-4 w-4" />,
  IF_NEEDED: <Minus className="h-4 w-4" />,
  UNAVAILABLE: <X className="h-4 w-4" />,
};

function formatDateTime(date: Date, timezone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(date));
}

function formatTime(date: Date, timezone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(date));
}

export const SCHEDULING_POLL_REFRESH_INTERVAL_MS = 30000;

export default function ParticipantPollViewClient({
  poll: initialPoll,
  participantToken,
}: Readonly<ParticipantPollViewClientProps>) {
  const { t, i18n } = useTranslation('scheduling');

  const [pollData, setPollData] = useState<PollData>(initialPoll);
  const [participantName, setParticipantName] = useState('');
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditButton, setShowEditButton] = useState(initialPoll.hasUserVoted && !!initialPoll.confirmedTimeOptionId);
  const [editingResponse, setEditingResponse] = useState(false);
  const hasDirtyVotesRef = useRef(false);
  const voteRequirementsId = 'participant-poll-submit-requirements';
  const voteRequirements = [!participantName.trim() ? t('common:actionRequirements.enterParticipantName') : null];

  const { data: refreshedData } = useSWR(
    `poll-${participantToken}`,
    () => getPollByParticipantTokenAction(participantToken),
    {
      refreshInterval: SCHEDULING_POLL_REFRESH_INTERVAL_MS,
      refreshWhenHidden: false,
    },
  );

  useEffect(() => {
    if (refreshedData?.success && refreshedData.data) {
      setPollData(refreshedData.data);
    }
  }, [refreshedData]);

  useEffect(() => {
    setVotes((currentVotes) => {
      const nextVotes: Record<string, VoteState> = {};
      pollData.timeOptions.forEach((opt) => {
        nextVotes[opt.id] = currentVotes[opt.id] ?? 'UNAVAILABLE';
      });
      return nextVotes;
    });
  }, [pollData.timeOptions]);

  const cycleVote = (timeOptionId: string) => {
    hasDirtyVotesRef.current = true;
    setVotes((prev) => {
      const current = prev[timeOptionId] || 'UNAVAILABLE';
      let next: VoteState;
      if (current === 'UNAVAILABLE') {
        next = 'AVAILABLE';
      } else if (current === 'AVAILABLE') {
        next = 'IF_NEEDED';
      } else {
        next = 'UNAVAILABLE';
      }
      return { ...prev, [timeOptionId]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const votesArray = Object.entries(votes).map(([timeOptionId, vote]) => ({
      timeOptionId,
      vote: vote as AvailabilityVote,
    }));

    const result = await submitVoteAction({
      pollId: pollData.id,
      participantName,
      participantToken: crypto.randomUUID(),
      votes: votesArray,
    });

    if (result.success) {
      const refreshed = await getPollByParticipantTokenAction(participantToken);
      if (refreshed.success && refreshed.data) {
        setPollData(refreshed.data);
        setShowEditButton(true);
        hasDirtyVotesRef.current = false;
        setEditingResponse(false);
      }
    } else {
      // AUDIT-20260613-022: a rejected vote (e.g. poll already confirmed) was
      // previously invisible; surface a localized error and keep the form intact.
      toast.error(t('errors.voteFailed'));
    }

    setIsSubmitting(false);
  };

  const confirmedOption = pollData.confirmedTimeOptionId
    ? pollData.timeOptions.find((opt) => opt.id === pollData.confirmedTimeOptionId)
    : null;

  const countsByOption: Record<string, { available: number; ifNeeded: number }> = {};
  pollData.timeOptions.forEach((opt) => {
    countsByOption[opt.id] = { available: 0, ifNeeded: 0 };
  });

  pollData.responses.forEach((response) => {
    response.votes.forEach((vote) => {
      if (countsByOption[vote.timeOptionId]) {
        if (vote.vote === 'AVAILABLE') {
          countsByOption[vote.timeOptionId].available++;
        } else if (vote.vote === 'IF_NEEDED') {
          countsByOption[vote.timeOptionId].ifNeeded++;
        }
      }
    });
  });

  const maxAvailable = Math.max(
    ...Object.values(countsByOption).map((c) => c.available),
    0,
  );

  const bestOptionIds = new Set(Object.entries(countsByOption)
    .filter(([, counts]) => counts.available === maxAvailable && maxAvailable > 0)
    .map(([id]) => id));

  if (confirmedOption && !editingResponse) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('vote.alreadyConfirmed')}</h2>
            <p className="text-gray-500 text-sm">{t('vote.confirmedTime')}</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900">{pollData.title}</p>
                <p className="text-sm text-emerald-700">
                  {formatDateTime(confirmedOption.startTime, pollData.timezone, i18n.resolvedLanguage || 'en')}
                  {confirmedOption.endTime && (
                    <> — {formatTime(confirmedOption.endTime, pollData.timezone, i18n.resolvedLanguage || 'en')}</>
                  )}
                </p>
              </div>
            </div>
            {pollData.location && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-emerald-200">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-emerald-700">{pollData.location}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <a
              href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(pollData.title)}%0ADTSTART:${new Date(confirmedOption.startTime).toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')}%0ADTEND:${confirmedOption.endTime ? new Date(confirmedOption.endTime).toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '') : new Date(new Date(confirmedOption.startTime).getTime() + 3600000).toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')}%0ALOCATION:${encodeURIComponent(pollData.location || '')}%0AEND:VEVENT%0AEND:VCALENDAR`}
              download={`${pollData.title.replaceAll(/[^a-z0-9]/gi, '_')}.ics`}
              className="flex-1"
            >
              <Button variant="primary" className="w-full">
                <CalendarPlus className="h-4 w-4 mr-2" />
                {t('organizer.downloadCalendar')}
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{pollData.title}</h1>
          {pollData.description && (
            <p className="text-gray-600 text-sm mb-2">{pollData.description}</p>
          )}
          <p className="text-gray-500 text-sm">
            {t('vote.createdBy', { name: pollData.organizerName })}
          </p>
        </div>

        {showEditButton && !editingResponse && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-700 mb-2">{t('vote.responseSaved')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingResponse(true)}
            >
              {t('vote.editResponse')}
            </Button>
          </div>
        )}

        {!pollData.hasUserVoted || editingResponse ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vote.enterName')}
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder={t('vote.namePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">{t('vote.availability')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-gray-500 pb-2 pr-4"></th>
                      {pollData.timeOptions.map((opt) => (
                        <th
                          key={opt.id}
                          className={`text-center text-xs pb-2 px-2 min-w-[80px] ${
                            bestOptionIds.has(opt.id) ? 'text-emerald-700 font-semibold' : 'text-gray-500'
                          }`}
                        >
                          <div>{formatDateTime(opt.startTime, pollData.timezone, i18n.resolvedLanguage || 'en').split(',')[0]}</div>
                          <div className="text-[10px]">
                            {formatTime(opt.startTime, pollData.timezone, i18n.resolvedLanguage || 'en')}
                            {opt.endTime && `–${formatTime(opt.endTime, pollData.timezone, i18n.resolvedLanguage || 'en')}`}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pr-4"></td>
                      {pollData.timeOptions.map((opt) => {
                        const counts = countsByOption[opt.id];
                        return (
                          <td key={opt.id} className="text-center py-2 px-2">
                            <div className={`text-xs ${bestOptionIds.has(opt.id) ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                              {counts.available} {t('results.availableCount', { count: counts.available }).split(' ')[1]}
                            </div>
                            {counts.ifNeeded > 0 && (
                              <div className="text-xs text-amber-600">
                                +{counts.ifNeeded} {t('vote.ifNeeded')}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="pr-4 py-2">
                        <span className="text-sm text-gray-700">{participantName || t('vote.namePlaceholder')}</span>
                      </td>
                      {pollData.timeOptions.map((opt) => {
                        const voteState = votes[opt.id] || 'UNAVAILABLE';
                        return (
                          <td key={opt.id} className="text-center py-2 px-2">
                            <button
                              type="button"
                              onClick={() => cycleVote(opt.id)}
                              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${voteColors[voteState]}`}
                            >
                              {voteIcons[voteState]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-400" />
                  <span>{t('vote.available')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-400" />
                  <span>{t('vote.ifNeeded')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
                  <span>{t('vote.unavailable')}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={!participantName.trim()}
              disabledReasonId={voteRequirementsId}
            >
              {isSubmitting ? t('vote.updating') : t('vote.submitVote')}
            </Button>
            <ActionRequirements id={voteRequirementsId} requirements={voteRequirements} />
          </form>
        ) : null}

        {pollData.responses.length > 0 && !editingResponse && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('results.participants')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-500 pb-2 pr-4">{t('results.participants')}</th>
                    {pollData.timeOptions.map((opt) => (
                      <th
                        key={opt.id}
                        className={`text-center text-xs pb-2 px-2 ${
                          bestOptionIds.has(opt.id) ? 'text-emerald-700 font-semibold' : 'text-gray-500'
                        }`}
                      >
                        <div className="text-[10px]">
                          {formatTime(opt.startTime, pollData.timezone, i18n.resolvedLanguage || 'en')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pollData.responses.map((response) => (
                    <tr key={response.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4 text-sm text-gray-900">{response.participantName}</td>
                      {pollData.timeOptions.map((opt) => {
                        const vote = response.votes.find((v) => v.timeOptionId === opt.id);
                        const voteState = (vote?.vote as VoteState) || 'UNAVAILABLE';
                        return (
                          <td key={opt.id} className="text-center py-2 px-2">
                            <div className={`inline-flex w-6 h-6 rounded items-center justify-center ${voteColors[voteState]}`}>
                              {voteIcons[voteState]}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pollData.responses.length === 0 && !editingResponse && (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t('vote.noResponses')}
          </div>
        )}
      </div>
    </div>
  );
}
