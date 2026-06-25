import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, CheckCircle2, Database, Globe, ServerCrash } from 'lucide-react';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

async function checkDatabase() {
  try {
    const start = Date.now();
    // SAFE: Static query, no user input - health check ping only
    await prisma.$queryRawUnsafe('SELECT 1');
    const dbLatency = Date.now() - start;
    return { dbStatus: 'ok', dbLatency };
  } catch {
    return { dbStatus: 'error', dbLatency: 0 };
  }
}

export async function generateMetadata() {
  const { t } = await getServerTranslation('health');
  return {
    title: `${t('title')} | Changemappers`,
    description: t('description'),
  };
}

export default async function HealthPage() {
  const { t, lang } = await getServerTranslation('health');
  const { dbStatus, dbLatency } = await checkDatabase();

  const isHealthy = dbStatus === 'ok';

  const dateFormatLocale: Record<string, string> = {
    en: 'en-US',
    hu: 'hu-HU',
    es: 'es-ES',
  };

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="flex flex-col items-center justify-center mb-10 text-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <Activity className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-lg">
          {t('description')}
        </p>
        {isHealthy ? (
          <Badge variant="default" className="text-sm px-4 py-1 bg-green-500 hover:bg-green-600">
            {t('allSystemsOperational')}
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-sm px-4 py-1">
            {t('serviceOutage')}
          </Badge>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="w-5 h-5" />
              {t('webInterface')}
            </CardTitle>
            <CardDescription>
              {t('webInterfaceDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-medium">{t('available')}</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">{t('online')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Database className="w-5 h-5" />
              {t('databaseService')}
            </CardTitle>
            <CardDescription>
              {t('databaseDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center justify-between p-4 rounded-lg border ${isHealthy ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'}`}>
              <div className="flex items-center gap-3">
                {isHealthy ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <ServerCrash className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {isHealthy ? t('connected') : t('connectionError')}
                </span>
              </div>
              <span className={`text-sm ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isHealthy ? `${dbLatency}ms` : t('offline')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-12">
        {t('lastUpdated')} {new Intl.DateTimeFormat(dateFormatLocale[lang] || 'hu-HU', { dateStyle: 'long', timeStyle: 'medium' }).format(new Date())}
      </p>
    </div>
  );
}
