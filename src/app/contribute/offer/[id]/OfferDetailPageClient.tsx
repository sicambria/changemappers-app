'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface OfferDetailPageClientProps {
  id: string;
  type: string;
  domain: string | null;
  format: string;
  timeCommitment: string;
  availability: string | null;
  prerequisites: string | null;
  offererName: string;
  offererProfilePhoto: string | null;
}

export default function OfferDetailPageClient({
  id,
  type,
  domain,
  format,
  timeCommitment,
  availability,
  prerequisites,
  offererName,
  offererProfilePhoto,
}: Readonly<OfferDetailPageClientProps>) {
  const { t } = useTranslation('contribute');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/contribute/find"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          ← {t('detailOffer.backToOffers')}
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">
            {t(`types.${type}`)}
          </h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {domain && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-800/60 text-slate-300 text-sm px-3 py-1">
                {domain}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-emerald-700/40 bg-emerald-900/40 text-emerald-300 text-sm px-3 py-1">
              {format}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-800/60 text-slate-400 text-sm px-3 py-1">
              {timeCommitment}
            </span>
          </div>

          {availability && (
            <p className="text-slate-300 leading-relaxed mb-8 whitespace-pre-wrap">
              {availability}
            </p>
          )}

          {prerequisites && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">{t('detailOffer.prerequisites')}</h2>
              <p className="text-slate-300">{prerequisites}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            {offererProfilePhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offererProfilePhoto}
                alt={offererName}
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0 w-10 h-10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-emerald-300">
                  {offererName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{offererName}</p>
              <p className="text-xs text-slate-500">{t('detailOffer.contributor')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/contribute/offer/${id}/edit`}
            className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium px-5 py-2.5 transition-colors"
          >
            {t('detailOffer.editOffer')}
          </Link>
        </div>
      </div>
    </div>
  );
}
