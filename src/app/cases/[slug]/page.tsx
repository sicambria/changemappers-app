import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { getServerTranslation } from '@/lib/server-i18n';
import { ensureForwardReciprocityPrompt } from '@/app/actions/forward-reciprocity';

export const dynamic = 'force-dynamic';

type Claim = { claim: string; confidence: string };

export default async function CaseDetailPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const { t } = await getServerTranslation('common');
  const item = await prisma.caseWithProvenance.findUnique({
    where: { slug },
    select: { id: true, title: true, summary: true, place: true, temporalClass: true, institutionalContext: true, outcomeClaims: true, lessons: true, contributorNotes: true, attribution: true, lineageAcknowledgment: true, pitch: { select: { id: true, name: true } } },
  });
  if (!item) notFound();
  const auth = await getCurrentUser();
  if (auth.success && auth.data) {
    await ensureForwardReciprocityPrompt({ userId: auth.data.id, trigger: 'BROWSED_CASE', triggerEntityId: item.id });
  }
  const claims = Array.isArray(item.outcomeClaims) ? item.outcomeClaims as Claim[] : [];
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/cases" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">{t('caseDetail.back')}</Link>
      <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-500"><span>{item.temporalClass}</span><span>{item.place}</span></div>
      <h1 className="mt-2 text-4xl font-semibold text-gray-950 dark:text-gray-50">{item.title}</h1>
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{item.summary}</p>
      <section className="mt-8"><h2 className="text-xl font-semibold">{t('caseDetail.institutionalContext')}</h2><p className="mt-2 text-gray-700 dark:text-gray-300">{item.institutionalContext}</p></section>
      <section className="mt-8"><h2 className="text-xl font-semibold">{t('caseDetail.outcomeClaims')}</h2><div className="mt-3 space-y-2">{claims.map((claim) => <div key={claim.claim} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"><p>{claim.claim}</p><p className="mt-1 text-xs text-gray-500">{t('caseDetail.declaredConfidence')} {claim.confidence}</p></div>)}</div></section>
      <section className="mt-8"><h2 className="text-xl font-semibold">{t('caseDetail.lessons')}</h2><p className="mt-2 text-gray-700 dark:text-gray-300">{item.lessons}</p></section>
      {item.contributorNotes && <section className="mt-8"><h2 className="text-xl font-semibold">{t('caseDetail.contributorNotes')}</h2><p className="mt-2 text-gray-700 dark:text-gray-300">{item.contributorNotes}</p></section>}
      <section className="mt-8 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800"><p><strong>{t('caseDetail.attribution')}</strong> {item.attribution}</p>{item.lineageAcknowledgment && <p className="mt-2"><strong>{t('caseDetail.lineageAcknowledgment')}</strong> {item.lineageAcknowledgment}</p>}{item.pitch && <p className="mt-2"><strong>{t('caseDetail.linkedPitch')}</strong> <Link href={`/pitch/${item.pitch.id}`} className="text-emerald-700 underline">{item.pitch.name}</Link></p>}</section>
    </main>
  );
}
