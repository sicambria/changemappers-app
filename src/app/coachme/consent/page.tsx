import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getConsentStatus } from '@/app/actions/coachme';
import { ReturningUserGate } from '../components';
import ConsentClientWrapper from './ConsentClientWrapper';

export const dynamic = 'force-dynamic';

export default async function ConsentPage() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    redirect('/login?redirect=/coachme/consent');
  }

  const consentStatus = await getConsentStatus();

  if (consentStatus.hasConsent && consentStatus.data) {
    return (
      <ReturningUserGate
        agreeTo="/coachme/new"
        exitTo="/reflect"
      />
    );
  }

  return <ConsentClientWrapper />;
}
