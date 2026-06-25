import { Metadata } from 'next';
import Link from 'next/link';
import InitiativeFormClient from '@/components/features/coordinate/InitiativeFormClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('kanban');
  return {
    title: t('metaTitle'),
  };
}

type Props = {
  searchParams: Promise<{ boardId?: string }>;
};

export default async function NewInitiativePage({ searchParams }: Readonly<Props>) {
  const { boardId } = await searchParams;
  const { t } = await getServerTranslation('kanban');

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <Link
            href={boardId ? `/tasks/${boardId}` : '/tasks'}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← {t('actions.back')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('startAnInitiative')}</h1>
          <p className="text-gray-600">
            {t('nameTheChange')}. {t('initiativeIntro')}
          </p>
        </div>

        <InitiativeFormClient boardId={boardId} />
      </div>
    </main>
  );
}
