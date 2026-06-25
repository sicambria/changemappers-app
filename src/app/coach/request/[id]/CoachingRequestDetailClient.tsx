'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface CoachingRequestDetailClientProps {
  request: {
    stuckOn: string;
    shiftsWanted: string;
    formatPreference: string | null;
    requester: {
      displayName: string | null;
      name: string | null;
      profilePhoto: string | null;
    };
  };
}

export function CoachingRequestDetailClient({ request }: Readonly<CoachingRequestDetailClientProps>) {
  const { t } = useTranslation('coaching');

  const requesterName = request.requester.displayName || request.requester.name || t('anonymous');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/coach/connections"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          {t('request.backToConnections')}
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">{t('request.detail.title')}</h1>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-2">{t('request.detail.stuckOn')}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {request.stuckOn}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-2">{t('request.detail.shiftsWanted')}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {request.shiftsWanted}
            </p>
          </div>

          {request.formatPreference && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">{t('request.detail.formatPreference')}</h2>
              <p className="text-slate-300">{request.formatPreference}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            {request.requester.profilePhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={request.requester.profilePhoto}
                alt={requesterName}
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0 w-10 h-10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-emerald-300">
                  {requesterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{requesterName}</p>
              <p className="text-xs text-slate-500">{t('request.detail.requester')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
