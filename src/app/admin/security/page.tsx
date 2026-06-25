import { Suspense } from 'react';
import { getServerTranslation } from '@/lib/server-i18n';
import { getKillSwitches } from '@/lib/security/kill-switch';
import { SecurityControlCenter } from '@/components/features/admin/SecurityControlCenter';

export const metadata = {
  title: 'Security Control Center | Admin',
};

/**
 * Admin Security Page
 * 
 * Provides a "Big Red Button" dashboard for emergency feature shutdowns.
 */
export default async function AdminSecurityPage() {
  const { t } = await getServerTranslation('admin');
  const killSwitches = await getKillSwitches();

  return (
    <div className="space-y-8">

      <Suspense fallback={<div className="p-12 text-center text-muted-foreground animate-pulse">{t('security.auditPolicy.loading')}</div>}>
        <SecurityControlCenter initialSwitches={killSwitches} />
      </Suspense>

      <div className="mt-12 p-6 border rounded-xl bg-muted/30 border-dashed">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          {t('security.auditPolicy.title')}
        </h2>
        <ul className="text-xs space-y-2 text-muted-foreground list-disc list-inside">
          {[0, 1, 2, 3].map((index) => (
            <li key={index}>{t(`security.auditPolicy.bullets.${index}`)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
