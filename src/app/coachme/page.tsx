import { getCurrentUser } from '@/app/actions/auth';
import { getConsentStatus, getActiveSession } from '@/app/actions/coachme';
import ClientRedirect from '@/components/shared/ClientRedirect';

export const dynamic = 'force-dynamic';

export default async function CoachMePage() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return <ClientRedirect href="/login?redirect=/coachme" />;
  }

  const [consentSettled, sessionSettled] = await Promise.allSettled([
    getConsentStatus(),
    getActiveSession(),
  ]);
  const consentStatus = consentSettled.status === 'fulfilled' ? consentSettled.value : { hasConsent: false };
  const activeSession = sessionSettled.status === 'fulfilled' ? sessionSettled.value : { success: false, data: null };

  if (!consentStatus.hasConsent) {
    return <ClientRedirect href="/coachme/consent" />;
  }

  if (activeSession.data) {
    return <ClientRedirect href={`/coachme/session/${activeSession.data.id}`} />;
  }

  return <ClientRedirect href="/coachme/new" />;
}
