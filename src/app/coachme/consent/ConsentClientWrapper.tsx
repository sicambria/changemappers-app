'use client';

import { useRouter } from 'next/navigation';
import { Phase0Consent } from '../components';

export default function ConsentClientWrapper() {
  const router = useRouter();

  const handleComplete = (_key: CryptoKey) => {
    router.push('/coachme/new');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
        <Phase0Consent onComplete={handleComplete} />
      </div>
    </div>
  );
}
