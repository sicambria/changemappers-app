import { getCurrentUser } from '@/app/actions/auth';
import { getConsentStatus } from '@/app/actions/coachme';
import ClientRedirect from '@/components/shared/ClientRedirect';
import NewSessionClient from './NewSessionClient';

export const dynamic = 'force-dynamic';

export default async function NewSessionPage() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return <ClientRedirect href="/login?redirect=/coachme/new" />;
  }

  const consentStatus = await getConsentStatus();
  if (!consentStatus.hasConsent) {
    return <ClientRedirect href="/coachme/consent" />;
  }

  return <NewSessionClient />;
}
