'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Pattern {
  id: string;
  name: string;
  status: string;
  category: string;
  definition: string;
  mechanismDescription: string;
  leveragePoints: string[];
  proposedBy: { name: string | null };
}

interface EnergyPatternLibraryClientProps {
  patterns: Pattern[];
}

export default function EnergyPatternLibraryClient({ patterns }: Readonly<EnergyPatternLibraryClientProps>) {
  const { t } = useTranslation('energy');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/energy" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t('backToCanvases')}
        </Link>
        <h1 className="text-3xl font-bold mt-4">{t('patternLibrary')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('patterns.subtitle')}
        </p>
      </div>

      {patterns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              {t('patterns.empty')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patterns.map((pattern) => (
            <Card key={pattern.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pattern.name}</CardTitle>
                  <Badge variant={pattern.status === 'VALIDATED' ? 'default' : 'secondary'}>
                    {pattern.status.toLowerCase()}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit">{pattern.category}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">{t('definition')}</p>
                  <p className="text-sm text-muted-foreground">{pattern.definition}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">{t('mechanism')}</p>
                  <p className="text-sm text-muted-foreground">{pattern.mechanismDescription}</p>
                </div>

                {pattern.leveragePoints.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">{t('patterns.leveragePoints')}</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {pattern.leveragePoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t text-xs text-muted-foreground">
                  {t('patterns.proposedByPrefix')} {pattern.proposedBy.name ?? t('patterns.unknownProposer')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
