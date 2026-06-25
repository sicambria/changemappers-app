import { getCurrentUser } from '@/app/actions/auth';
import { getSessionHistory, getConsentStatus } from '@/app/actions/coachme';
import ClientRedirect from '@/components/shared/ClientRedirect';
import ProgressClient from './ProgressClient';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return <ClientRedirect href="/login?redirect=/coachme/progress" />;
  }

  const [consentSettled, sessionsSettled] = await Promise.allSettled([
    getConsentStatus(),
    getSessionHistory(),
  ]);
  const consentStatus = consentSettled.status === 'fulfilled' ? consentSettled.value : { hasConsent: false };
  const sessionsResult = sessionsSettled.status === 'fulfilled' ? sessionsSettled.value : { success: false, data: null };

  if (!consentStatus.hasConsent) {
    return <ClientRedirect href="/coachme/consent" />;
  }

  const sessions = sessionsResult.success && sessionsResult.data ? sessionsResult.data : [];

  return <ProgressClient initialSessions={sessions} />;
}
