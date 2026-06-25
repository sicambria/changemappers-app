import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import PitchForm from '@/components/features/pitch/PitchForm';

export default async function NewPitchPage() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect('/login?redirect=/pitch/new');
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <PitchForm />
      </div>
    </main>
  );
}
