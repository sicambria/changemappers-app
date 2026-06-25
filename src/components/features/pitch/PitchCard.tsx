'use client';

import Link from 'next/link';
import { MapPinIcon } from 'lucide-react';

interface PitchCardProps {
  pitch: {
    id: string;
    name: string;
    summary: string;
    location: string;
    stage: string;
    temporalClass?: string;
    license?: string;
    protocolLabels?: string[];
    casesWithProvenance?: boolean;
    notInRoomAck?: string | null;
    needsFunding: boolean;
    needsPartners: boolean;
    needsVolunteers: boolean;
    needsSkills: string[];
    author: {
      name: string;
      displayName: string | null;
      profilePhoto: string | null;
    };
    rdgTags: Array<{
      rdg: {
        key: string;
        label: string;
        labelHu: string | null;
      };
    }>;
    _count: {
      endorsements: number;
    };
  };
  language?: 'hu' | 'en' | 'es';
}

const STAGE_COLORS: Record<string, string> = {
  IDEA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  RESEARCH: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PROTOTYPE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PILOT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  OPERATING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  SCALING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const STAGE_LABELS_HU: Record<string, string> = {
  IDEA: '\u00d6tlet',
  RESEARCH: 'Kutat\u00e1s',
  PROTOTYPE: 'Protot\u00edpus',
  PILOT: 'Pilot',
  OPERATING: 'M\u0171k\u00f6dik',
  SCALING: 'Sk\u00e1l\u00e1z\u00f3dik',
};

const STAGE_LABELS_EN: Record<string, string> = {
  IDEA: 'Idea',
  RESEARCH: 'Research',
  PROTOTYPE: 'Prototype',
  PILOT: 'Pilot',
  OPERATING: 'Operating',
  SCALING: 'Scaling',
};

const STAGE_LABELS_ES: Record<string, string> = {
  IDEA: 'Idea',
  RESEARCH: 'Investigacion',
  PROTOTYPE: 'Prototipo',
  PILOT: 'Piloto',
  OPERATING: 'Operativo',
  SCALING: 'Escalando',
};

function getStageLabels(language: string): Record<string, string> {
  if (language === 'hu') return STAGE_LABELS_HU;
  if (language === 'es') return STAGE_LABELS_ES;
  return STAGE_LABELS_EN;
}

function getNeedsLabel(language: string): string {
  if (language === 'hu') return 'Kell:';
  if (language === 'es') return 'Necesita:';
  return 'Needs:';
}

function getEndorsementsLabel(language: string): string {
  if (language === 'hu') return 'támogatás';
  if (language === 'es') return 'apoyos';
  return 'endorsements';
}

function localize(lang: string, labels: { hu: string; es: string; en: string }): string {
  if (lang === 'hu') return labels.hu;
  if (lang === 'es') return labels.es;
  return labels.en;
}

function getPrimaryNeed(pitch: PitchCardProps['pitch'], lang: string): string | null {
  if (pitch.needsSkills.length > 0) {
    const count = pitch.needsSkills.length;
    return localize(lang, {
      hu: `K\u00e9szs\u00e9gek (${count})`,
      es: `Habilidades (${count})`,
      en: `Skills (${count})`,
    });
  }
  if (pitch.needsFunding) {
    return localize(lang, { hu: 'Finansz\u00edroz\u00e1s', es: 'Financiamiento', en: 'Funding' });
  }
  if (pitch.needsPartners) {
    return localize(lang, { hu: 'Partnerek', es: 'Socios', en: 'Partners' });
  }
  if (pitch.needsVolunteers) {
    return localize(lang, { hu: '\u00d6nk\u00e9ntesek', es: 'Voluntarios', en: 'Volunteers' });
  }
  return null;
}

export default function PitchCard({ pitch, language = 'en' }: Readonly<PitchCardProps>) {
  const displayName = pitch.author.displayName ?? pitch.author.name;
  const stageLabels = getStageLabels(language);
  const needsLabel = getNeedsLabel(language);
  const endorsementsLabel = getEndorsementsLabel(language);
  const primaryNeed = getPrimaryNeed(pitch, language);

  return (
    <Link
      href={`/pitch/${pitch.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {pitch.name}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[pitch.stage] ?? 'bg-gray-100 text-gray-800'}`}
        >
          {stageLabels[pitch.stage] ?? pitch.stage}
        </span>
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
        {pitch.summary}
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {pitch.rdgTags.slice(0, 3).map((tag) => (
          <span
            key={tag.rdg.key}
            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
          >
            {language === 'hu' && tag.rdg.labelHu ? tag.rdg.labelHu : tag.rdg.label}
          </span>
        ))}
        {pitch.rdgTags.length > 3 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            +{pitch.rdgTags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <MapPinIcon className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{pitch.location}</span>
        </div>
        {primaryNeed && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">
            {needsLabel} {primaryNeed}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {pitch.author.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pitch.author.profilePhoto}
              alt={displayName}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-600 dark:text-gray-400">{displayName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          {pitch._count.endorsements > 0 && (
            <span>
              {pitch._count.endorsements} {endorsementsLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
