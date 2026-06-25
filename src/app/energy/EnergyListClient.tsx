'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Canvas {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  createdBy: { name: string | null };
  _count: { entities: number; relations: number };
}

interface EnergyListClientProps {
  canvases: Canvas[];
}

export default function EnergyListClient({ canvases }: Readonly<EnergyListClientProps>) {
  const { t } = useTranslation('energy');

  return (
    <div className="container mx-auto h-full overflow-y-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <Link href="/energy/new">
          <Button>{t('newCanvas')}</Button>
        </Link>
      </div>

      {canvases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">{t('noCanvasesYet')}</p>
            <Link href="/energy/new">
              <Button>{t('newCanvas')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canvases.map((canvas) => (
            <Link key={canvas.id} href={`/energy/${canvas.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{canvas.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {canvas.description || 'No description'}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{canvas._count.entities} entities</span>
                    <span>{canvas._count.relations} relations</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    By {canvas.createdBy.name}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
