'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { EntityFormClient } from '@/components/features/energy/EntityFormClient';

interface NewEntityClientProps {
  canvasId: string;
  canvasTitle: string;
}

export default function NewEntityClient({ canvasId, canvasTitle }: Readonly<NewEntityClientProps>) {
  const { t } = useTranslation('energy');

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Link
        href={`/energy/${canvasId}`}
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← {t('backToCanvas')}
      </Link>

      <EntityFormClient canvasId={canvasId} canvasTitle={canvasTitle} />
    </div>
  );
}
