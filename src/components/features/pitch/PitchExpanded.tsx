'use client';

import { MapPinIcon, GlobeIcon, MailIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PitchExpandedProps {
  pitch: {
    id: string;
    name: string;
    summary: string;
    location: string;
    website: string | null;
    language: string;
    localContext: string;
    systemicChallenge: string;
    vision: string;
    expectedOutcomes: string;
    teamDescription: string;
    experience: string | null;
    evidenceLinks: string[];
    temporalClass: string;
    license: string;
    protocolLabels: string[];
    casesWithProvenance: boolean;
    notInRoomAck: string | null;
    stage: string;
    mainObstacles: string;
    needsSkills: string[];
    needsFunding: boolean;
    fundingAmount: number | null;
    fundingCurrency: string | null;
    needsPartners: boolean;
    needsVolunteers: boolean;
    needsKnowledge: string | null;
    needsOther: string | null;
    callToAction: string;
    contactEmail: string | null;
    usePlatformMessaging: boolean;
    publishedAt: Date | null;
    author: {
      id: string;
      name: string;
      displayName: string | null;
      profilePhoto: string | null;
    };
    community: { id: string; name: string } | null;
    rdgTags: Array<{
      rdg: {
        key: string;
        label: string;
        labelHu: string | null;
        category: string;
      };
    }>;
    endorsements: Array<{
      id: string;
      message: string | null;
      createdAt: Date;
      endorser: {
        id: string;
        name: string;
        displayName: string | null;
        profilePhoto: string | null;
      };
    }>;
    _count: {
      endorsements: number;
    };
  };
  viewerId?: string;
  uiLanguage?: 'hu' | 'en';
}

const STAGE_COLORS: Record<string, string> = {
  IDEA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  RESEARCH: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PROTOTYPE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PILOT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  OPERATING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  SCALING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const DETAIL_LABEL_KEYS = {
  context: 'detail.labels.context',
  challenge: 'detail.labels.challenge',
  vision: 'detail.labels.vision',
  outcomes: 'detail.labels.outcomes',
  team: 'detail.labels.team',
  experience: 'detail.labels.experience',
  evidence: 'detail.labels.evidence',
  obstacles: 'detail.labels.obstacles',
  needs: 'detail.labels.needs',
  skills: 'detail.labels.skills',
  funding: 'detail.labels.funding',
  partners: 'detail.labels.partners',
  volunteers: 'detail.labels.volunteers',
  knowledge: 'detail.labels.knowledge',
  other: 'detail.labels.other',
  callToAction: 'detail.labels.callToAction',
  rdgAlignment: 'detail.labels.rdgAlignment',
  stewardshipMetadata: 'detail.labels.stewardshipMetadata',
  casesWithProvenance: 'detail.labels.casesWithProvenance',
  endorsements: 'detail.labels.endorsements',
  contact: 'detail.labels.contact',
  sendMessage: 'detail.labels.sendMessage',
  viewProfile: 'detail.labels.viewProfile',
  publishedOn: 'detail.labels.publishedOn',
  by: 'detail.labels.by',
} as const;

type DetailLabel = keyof typeof DETAIL_LABEL_KEYS;

function formatFunding(amount: number, currency: string | null, locale: string): string {
  const curr = currency ?? 'HUF';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PitchExpanded({ pitch, viewerId, uiLanguage = 'en' }: Readonly<PitchExpandedProps>) {
  const { t } = useTranslation('pitch');
  const locale = uiLanguage === 'hu' ? 'hu' : 'en';
  const translate = (key: string) => t(key, { lng: uiLanguage });
  const labels = Object.fromEntries(
    Object.entries(DETAIL_LABEL_KEYS).map(([label, key]) => [label, translate(key)]),
  ) as Record<DetailLabel, string>;
  const stageLabel = translate(`stages.${pitch.stage}`);
  const rdgLabel = (rdg: { label: string; labelHu: string | null }) =>
    uiLanguage === 'hu' && rdg.labelHu ? rdg.labelHu : rdg.label;

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${STAGE_COLORS[pitch.stage]}`}
          >
            {stageLabel}
          </span>
          {pitch.rdgTags.map((tag) => (
            <span
              key={tag.rdg.key}
              className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
            >
              {rdgLabel(tag.rdg)}
            </span>
          ))}
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {pitch.name}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300">{pitch.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            <span>{pitch.location}</span>
          </div>
          {pitch.website && (
            <a
              href={pitch.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
            >
              <GlobeIcon className="h-4 w-4" />
              <span>{new URL(pitch.website).hostname}</span>
            </a>
          )}
        </div>
      </header>

      <section className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{labels.stewardshipMetadata}</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-sky-50 px-2 py-1 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">{pitch.temporalClass}</span>
          <span className="rounded bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{pitch.license}</span>
          {pitch.protocolLabels.map((label) => <span key={label} className="rounded bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{label}</span>)}
          {pitch.casesWithProvenance && <span className="rounded bg-amber-50 px-2 py-1 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">{labels.casesWithProvenance}</span>}
        </div>
        {pitch.notInRoomAck && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{pitch.notInRoomAck}</p>}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.context}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{pitch.localContext}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.challenge}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{pitch.systemicChallenge}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.vision}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{pitch.vision}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.outcomes}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{pitch.expectedOutcomes}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.team}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{pitch.teamDescription}</p>
        {pitch.experience && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{pitch.experience}</p>
        )}
        {pitch.evidenceLinks.length > 0 && (
          <div className="mt-2">
            <span className="text-sm text-gray-500">{labels.evidence}:</span>
            <ul className="mt-1 space-y-1">
              {pitch.evidenceLinks.map((link) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.obstacles}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{pitch.mainObstacles}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {labels.needs}
        </h2>
        <div className="flex flex-wrap gap-2">
          {pitch.needsSkills.length > 0 && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              {labels.skills}: {pitch.needsSkills.join(', ')}
            </span>
          )}
          {pitch.needsFunding && pitch.fundingAmount && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              {labels.funding}: {formatFunding(pitch.fundingAmount, pitch.fundingCurrency, locale)}
            </span>
          )}
          {pitch.needsPartners && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              {labels.partners}
            </span>
          )}
          {pitch.needsVolunteers && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              {labels.volunteers}
            </span>
          )}
          {pitch.needsKnowledge && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              {labels.knowledge}: {pitch.needsKnowledge}
            </span>
          )}
          {pitch.needsOther && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              {labels.other}: {pitch.needsOther}
            </span>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <h2 className="mb-2 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          {labels.callToAction}
        </h2>
        <p className="text-emerald-800 dark:text-emerald-200">{pitch.callToAction}</p>
      </section>

      {(pitch.usePlatformMessaging || pitch.contactEmail) && viewerId && viewerId !== pitch.author.id && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {labels.contact}
          </h2>
          <div className="flex flex-wrap gap-3">
            {pitch.usePlatformMessaging && (
              <a
                href={`/messages?to=${pitch.author.id}&pitch=${pitch.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {labels.sendMessage}
              </a>
            )}
            {pitch.contactEmail && (
              <a
                href={`mailto:${pitch.contactEmail}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <MailIcon className="h-4 w-4" />
                {pitch.contactEmail}
              </a>
            )}
          </div>
        </section>
      )}

      <section className="mb-6 border-t border-gray-200 pt-6 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {pitch.author.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pitch.author.profilePhoto}
              alt={pitch.author.displayName ?? pitch.author.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {(pitch.author.displayName ?? pitch.author.name).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {pitch.author.displayName ?? pitch.author.name}
            </p>
            {pitch.publishedAt && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {labels.publishedOn} {new Date(pitch.publishedAt).toLocaleDateString(locale)}
              </p>
            )}
          </div>
        </div>
      </section>

      {pitch.endorsements.length > 0 && (
        <section className="border-t border-gray-200 pt-6 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {labels.endorsements} ({pitch._count.endorsements})
          </h2>
          <div className="space-y-3">
            {pitch.endorsements.map((endorsement) => (
              <div
                key={endorsement.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
        <div className="flex items-center gap-2">
          {endorsement.endorser.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={endorsement.endorser.profilePhoto}
              alt={endorsement.endorser.displayName ?? endorsement.endorser.name}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {(endorsement.endorser.displayName ?? endorsement.endorser.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {endorsement.endorser.displayName ?? endorsement.endorser.name}
                  </span>
                </div>
                {endorsement.message && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{endorsement.message}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
