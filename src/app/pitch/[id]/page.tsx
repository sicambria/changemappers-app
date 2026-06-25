import { notFound } from 'next/navigation';
import { getPitchAction } from '@/app/actions/pitch';
import { getCurrentUser } from '@/lib/get-current-user';
import PitchExpanded from '@/components/features/pitch/PitchExpanded';
import Link from 'next/link';
import { getServerTranslation } from '@/lib/server-i18n';

interface PitchDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PitchDetailPage({ params }: Readonly<PitchDetailPageProps>) {
  const { id } = await params;
  const { t } = await getServerTranslation('pitch');
  const auth = await getCurrentUser();
  const result = await getPitchAction(id);

  if (!result.success) {
    notFound();
  }

  const pitch = result.data;
  const author = pitch.author as { id: string; name: string; displayName?: string | null } | undefined;
  const community = pitch.community as { id: string; name: string } | null | undefined;
  const rdgTags = (pitch.rdgTags as Array<{ rdg: { id: string; key: string; label: string; labelHu: string | null } }> | undefined) ?? [];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <PitchExpanded
        pitch={pitch}
        viewerId={auth.success ? auth.data?.id : undefined}
        uiLanguage="hu"
      />
      <section className="mx-auto mt-8 max-w-5xl rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('detail.linkedContext')}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {author && (
            <Link href={'/profile/' + author.id} className="rounded-full bg-gray-100 px-3 py-1 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800">
              {author.displayName || author.name}
            </Link>
          )}
          {community && (
            <Link href={'/communities/' + community.id} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-100">
              {community.name}
            </Link>
          )}
          {rdgTags.map(({ rdg }) => (
            <Link key={rdg.id} href={'/causes/' + (rdg.key || rdg.id)} className="rounded-full bg-sky-50 px-3 py-1 text-sky-800 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-100">
              {rdg.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
