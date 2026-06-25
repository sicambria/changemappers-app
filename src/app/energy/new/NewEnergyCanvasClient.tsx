'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { CanvasFormClient } from '@/components/features/energy/CanvasFormClient';

export default function NewEnergyCanvasClient() {
  const { t } = useTranslation('energy');

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Link href="/energy" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← {t('backToCanvases')}
      </Link>

      <CanvasFormClient />
    </div>
  );
}
