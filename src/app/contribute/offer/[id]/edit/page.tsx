import { getContributionOfferByIdAction } from '@/app/actions/contribute';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/server-i18n';
import type { CreateContributionOfferInput } from '@/lib/validations/contribute';
import EditOfferPageClient from './EditOfferPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  const { t } = await getServerTranslation('contribute');

  return {
    title: `${t('metadata.editOffer.title')} | Changemappers`,
  };
}

export const dynamic = 'force-dynamic';

export default async function EditContributionOfferPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const offer = await getContributionOfferByIdAction(id);

  if (!offer) {
    notFound();
  }

  return (
    <EditOfferPageClient
      id={id}
      initialData={{
        type: offer.type as CreateContributionOfferInput['type'],
        domain: offer.domain ?? undefined,
        timeCommitment: offer.timeCommitment,
        format: offer.format,
        availability: offer.availability,
        prerequisites: offer.prerequisites ?? undefined,
      }}
    />
  );
}
