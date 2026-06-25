'use client';

/**
 * ForwardReciprocityPrompt
 *
 * Surfaces after any completed connection across all modalities.
 * The structural mechanism that turns a sustainable system into a regenerative one:
 * not returning the favour, but moving it forward to someone earlier in the journey.
 *
 * This component must render after every completion — not as a popup, not optional
 * at the action level, but as a persistent call-to-action in the post-completion UI.
 */

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface ForwardReciprocityPromptProps {
  /** Link destination — defaults to /contribute/offer/new but can be modality-specific */
  offerPath?: string;
  /** Additional context about what was received */
  context?: string;
  className?: string;
}

export default function ForwardReciprocityPrompt({
  offerPath = '/contribute/offer/new',
  context,
  className = '',
}: Readonly<ForwardReciprocityPromptProps>) {
  const { t } = useTranslation('modalities');

  return (
    <section
      className={`rounded-xl border border-primary/20 bg-primary/5 p-5 ${className}`}
      aria-label={t('forwardReciprocity.title')}
    >
      <h3 className="text-base font-semibold text-foreground mb-1">
        {t('forwardReciprocity.title')}
      </h3>
      {context && (
        <p className="text-sm text-muted-foreground mb-2">{context}</p>
      )}
      <p className="text-sm text-muted-foreground mb-4">
        {t('forwardReciprocity.body')}
      </p>
      <div className="flex items-center gap-3">
        <Link
          href={offerPath}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('forwardReciprocity.createOffer')}
        </Link>
        <span className="text-xs text-muted-foreground">
          {t('forwardReciprocity.skip')}
        </span>
      </div>
    </section>
  );
}
