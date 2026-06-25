'use client';

/**
 * ModalitySelectorTooltip
 *
 * Renders brief orienting descriptions for each developmental modality.
 * This component prevents mismatched expectations — the primary source of harm
 * when modalities are confused. It surfaces before any match is made.
 *
 * Design principle: the descriptions are not decoration. They are the structural
 * mechanism that prevents someone seeking emotional support from landing in a
 * training relationship, or someone expecting advice from landing in coaching.
 */

import { useTranslation } from 'react-i18next';

interface ModalitySelectorTooltipProps {
  modality: 'training' | 'mentoring' | 'peer' | 'coaching' | 'contribute';
  className?: string;
}

const MODALITY_ICONS: Record<string, string> = {
  training: '📚',
  mentoring: '🧭',
  peer: '🤝',
  coaching: '💬',
  contribute: '🌱',
};

export default function ModalitySelectorTooltip({
  modality,
  className = '',
}: Readonly<ModalitySelectorTooltipProps>) {
  const { t } = useTranslation('modalities');

  const label = t(`selector.${modality}.label`);
  const description = t(`selector.${modality}.description`);
  const icon = MODALITY_ICONS[modality] ?? '•';

  return (
    <div className={`rounded-lg border border-border bg-card p-3 text-sm ${className}`}>
      <div className="flex items-center gap-2 font-medium text-foreground mb-1">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}
