import Link from 'next/link';
import { MailQuestionIcon } from 'lucide-react';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return { title: `${t('emailHelpPage.metadataTitle')} | Changemappers` };
}

export default async function EmailNotArrivingPage() {
  const { t } = await getServerTranslation('common');

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-2xl flex-col justify-center px-4 py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
            <MailQuestionIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">{t('emailHelpPage.title')}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('emailHelpPage.body')}</p>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {t('emailHelpPage.contactPrefix')}{' '}
              <a className="font-semibold text-emerald-700 underline" href="mailto:changemappers@pm.me">changemappers@pm.me</a>{' '}
              {t('emailHelpPage.contactSuffix')}
            </p>
            <Link href="/login" className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {t('emailHelpPage.backToLogin')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
