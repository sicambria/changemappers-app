import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Engagement = {
  id: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  offer: {
    domain: string;
    format: string;
    level: string;
    creator: { name: string | null; profilePhoto: string | null };
  };
  request: {
    skillGapDescription: string;
    requester: { name: string | null; profilePhoto: string | null };
  };
  feedback: { learnerReflection: string } | null;
};

type Props = {
  engagements: Engagement[];
  currentUserId?: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-950 border-amber-800',
  ACTIVE: 'text-emerald-400 bg-emerald-950 border-emerald-800',
  COMPLETE: 'text-blue-400 bg-blue-950 border-blue-800',
  CANCELLED: 'text-slate-400 bg-slate-800 border-slate-700',
};

export default function TrainingEngagementList({ engagements }: Readonly<Props>) {
  const { t, i18n } = useTranslation('training');
  const dateLocale = i18n.resolvedLanguage || 'en';

  const getStatusLabel = (status: string) => {
    const key = `engagement.status.${status}`;
    return t(key, { defaultValue: status });
  };

  if (engagements.length === 0) {
    return (
      <div className="text-slate-500 text-sm py-6">
        {t('engagement.empty')}{' '}
        <Link href="/training/find" className="text-emerald-400 hover:underline">
          {t('engagement.browseOffers')}
        </Link>{' '}
        {t('engagement.or')}{' '}
        <Link href="/training/offer/new" className="text-emerald-400 hover:underline">
          {t('engagement.offerTraining')}
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {engagements.map((eng) => {
        const statusColor = STATUS_COLORS[eng.status] ?? STATUS_COLORS.CANCELLED;
        const statusLabel = getStatusLabel(eng.status);
        const needsFeedback = eng.status === 'COMPLETE' && !eng.feedback;

        return (
          <div
            key={eng.id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-slate-100">
                    {eng.offer.domain}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-800 rounded px-2 py-0.5">
                    {eng.offer.format}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-800 rounded px-2 py-0.5">
                    {eng.offer.level}
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {eng.request.skillGapDescription}
                </p>
              </div>
            <span
              className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-1 ${statusColor}`}
            >
              {statusLabel}
            </span>
            </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{t('engagement.trainer', { name: eng.offer.creator.name ?? t('engagement.unknown') })}</span>
          <span>·</span>
          <span>{t('engagement.learner', { name: eng.request.requester.name ?? t('engagement.unknown') })}</span>
          {eng.completedAt && (
            <>
              <span>·</span>
              <span>{t('engagement.completedDate', { date: new Date(eng.completedAt).toLocaleDateString(dateLocale) })}</span>
            </>
          )}
        </div>

            {eng.feedback && (
              <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('engagement.reflection')}</p>
                <p>{eng.feedback.learnerReflection}</p>
              </div>
            )}

            {needsFeedback && (
              <Link
                href={`/training/connections`}
                className="inline-block text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-800 rounded-lg px-3 py-1.5 transition-colors"
              >
                {t('engagement.writeReflection')}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
