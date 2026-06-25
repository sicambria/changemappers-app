'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, CheckCircle2, CalendarPlus, Check, X, Minus, ShieldCheck, Users } from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  confirmTimeAction,
  unconfirmTimeAction,
  getPollByOrganizerTokenAction,
} from '@/app/actions/scheduling';
import { SCHEDULING_POLL_REFRESH_INTERVAL_MS } from './ParticipantPollViewClient';

type VoteState = 'AVAILABLE' | 'IF_NEEDED' | 'UNAVAILABLE';

interface TimeOption {
  id: string;
  startTime: Date;
  endTime: Date | null;
  sortOrder: number;
  _count?: { votes: number };
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
  totalInvited: number;
}

interface OrganizerPollViewClientProps {
  poll: PollData;
  organizerToken: string;
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

export default function OrganizerPollViewClient({
  poll: initialPoll,
  organizerToken,
}: Readonly<OrganizerPollViewClientProps>) {
  const { t, i18n } = useTranslation('scheduling');

  const [pollData, setPollData] = useState<PollData>(initialPoll);
  const [confirmingOption, setConfirmingOption] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUnconfirming, setIsUnconfirming] = useState(false);

  const { data: refreshedData } = useSWR(
    `poll-organizer-${organizerToken}`,
    () => getPollByOrganizerTokenAction(organizerToken),
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

  const handleConfirmClick = (optionId: string) => {
    setConfirmingOption(optionId);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!confirmingOption) return;
    setIsConfirming(true);
    const result = await confirmTimeAction({
      pollId: pollData.id,
      timeOptionId: confirmingOption,
      organizerToken,
    });
    if (result.success) {
      const refreshed = await getPollByOrganizerTokenAction(organizerToken);
      if (refreshed.success && refreshed.data) {
        setPollData(refreshed.data);
      }
      setShowConfirmDialog(false);
      setConfirmingOption(null);
    } else {
      // AUDIT-20260613-022: surface confirm failures instead of silently closing
      // the dialog as if the time were confirmed; keep the dialog open to retry.
      toast.error(t('errors.confirmFailed'));
    }
    setIsConfirming(false);
  };

  const handleUnconfirm = async () => {
    setIsUnconfirming(true);
    // AUDIT-20260613-022: previously the result was discarded entirely and a
    // refresh ran regardless; now check it and surface failure.
    const result = await unconfirmTimeAction({ pollId: pollData.id, organizerToken });
    if (result.success) {
      const refreshed = await getPollByOrganizerTokenAction(organizerToken);
      if (refreshed.success && refreshed.data) {
        setPollData(refreshed.data);
      }
    } else {
      toast.error(t('errors.unconfirmFailed'));
    }
    setIsUnconfirming(false);
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

  const bestOptionIds = Object.entries(countsByOption)
    .filter(([, counts]) => counts.available === maxAvailable && maxAvailable > 0)
    .map(([id]) => id);

  const pendingCount = Math.max(0, pollData.totalInvited - pollData.responses.length);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">{t('organizer.title')}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{pollData.title}</h1>
            {pollData.description && (
              <p className="text-gray-600 text-sm mt-1">{pollData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-4 w-4" />
            <span>{pollData.responses.length} {t('organizer.responses').toLowerCase()}</span>
          </div>
        </div>

        {pendingCount > 0 && !pollData.confirmedTimeOptionId && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700">
              {t('organizer.pendingResponses', { count: pendingCount })}
            </p>
          </div>
        )}

        {confirmedOption ? (
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-900">{t('organizer.confirmed')}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
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
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm text-emerald-700">{t('organizer.shareLocation', { location: pollData.location })}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <a
                href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(pollData.title)}%0ADTSTART:${new Date(confirmedOption.startTime).toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')}%0ADTEND:${confirmedOption.endTime ? new Date(confirmedOption.endTime).toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '') : new Date(new Date(confirmedOption.startTime).getTime() + 3600000).toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')}%0ALOCATION:${encodeURIComponent(pollData.location || '')}%0AEND:VEVENT%0AEND:VCALENDAR`}
                download={`${pollData.title.replaceAll(/[^a-z0-9]/gi, '_')}.ics`}
              >
                <Button variant="outline" size="sm">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  {t('organizer.downloadCalendar')}
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnconfirm}
                isLoading={isUnconfirming}
              >
                {t('organizer.unconfirm')}
              </Button>
            </div>
          </div>
        ) : null}

        {!pollData.confirmedTimeOptionId && (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-500 pb-2 pr-4">{t('results.participants')}</th>
                    {pollData.timeOptions.map((opt) => (
                      <th
                        key={opt.id}
                        className={`text-center text-xs pb-2 px-2 min-w-[100px] ${
                          bestOptionIds.includes(opt.id) ? 'text-emerald-700 font-semibold' : 'text-gray-500'
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
                  <tr className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-xs text-gray-500">{t('results.participants')}</td>
                    {pollData.timeOptions.map((opt) => {
                      const counts = countsByOption[opt.id];
                      return (
                        <td key={opt.id} className="text-center py-2 px-2">
                          <div className={`text-sm ${bestOptionIds.includes(opt.id) ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>
                            {counts.available}
                          </div>
                          {counts.ifNeeded > 0 && (
                            <div className="text-xs text-amber-600">
                              +{counts.ifNeeded}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
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

            {bestOptionIds.length > 0 && (
              <div className="text-center text-sm text-emerald-700 font-medium mb-4">
                {t('results.bestTime')}: {bestOptionIds.map((id) => {
                  const opt = pollData.timeOptions.find((o) => o.id === id);
                  return opt ? formatDateTime(opt.startTime, pollData.timezone, i18n.resolvedLanguage || 'en') : '';
                }).join(', ')}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('organizer.confirmTime')}</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {pollData.timeOptions.map((opt) => (
                  <Button
                    key={opt.id}
                    variant={bestOptionIds.includes(opt.id) ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleConfirmClick(opt.id)}
                    className="justify-start"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDateTime(opt.startTime, pollData.timezone, i18n.resolvedLanguage || 'en')}
                    {opt.endTime && ` – ${formatTime(opt.endTime, pollData.timezone, i18n.resolvedLanguage || 'en')}`}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showConfirmDialog && Boolean(confirmingOption)}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmingOption(null);
        }}
        ariaLabelledBy="organizer-confirm-dialog-title"
        closeOnEscape={!isConfirming}
        closeOnBackdropClick={!isConfirming}
        className="max-w-md"
      >
        {confirmingOption && (
          <div className="bg-white rounded-xl shadow-lg w-full p-6">
            <h3 id="organizer-confirm-dialog-title" className="text-lg font-bold text-gray-900 mb-3">{t('organizer.confirmDialogTitle')}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('organizer.confirmDialogMessage', {
                date: formatDateTime(
                  pollData.timeOptions.find((o) => o.id === confirmingOption)!.startTime,
                  pollData.timezone,
                  i18n.resolvedLanguage || 'en'
                ),
              })}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmingOption(null);
                }}
              >
                {t('organizer.cancelButton')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirm}
                isLoading={isConfirming}
              >
                {t('organizer.confirmButton')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
