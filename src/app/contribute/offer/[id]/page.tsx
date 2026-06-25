import { getContributionOfferByIdAction } from '@/app/actions/contribute';
import { getServerTranslation } from '@/lib/server-i18n';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import OfferDetailPageClient from './OfferDetailPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  const { t } = await getServerTranslation('contribute');

  return {
    title: `${t('metadata.detailOffer.title')} | Changemappers`,
  };
}

export const dynamic = 'force-dynamic';

export default async function ContributionOfferDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const offer = await getContributionOfferByIdAction(id);

  if (!offer) {
    notFound();
  }

  const { t } = await getServerTranslation('contribute');
  const offererName = offer.offerer.displayName || offer.offerer.name || t('anonymous');

  return (
    <OfferDetailPageClient
      id={id}
      type={offer.type}
      domain={offer.domain}
      format={offer.format}
      timeCommitment={offer.timeCommitment}
      availability={offer.availability}
      prerequisites={offer.prerequisites}
      offererName={offererName}
      offererProfilePhoto={offer.offerer.profilePhoto}
    />
  );
}
