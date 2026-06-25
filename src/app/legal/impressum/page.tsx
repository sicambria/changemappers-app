import type { Metadata } from 'next';
import { LegalDocument, type LegalDocumentContent } from '@/components/legal/LegalDocument';
import { getMetadataTranslations } from '@/lib/server-i18n';

type LegalNamespace = {
  impressum: LegalDocumentContent & {
    metadata: { title: string; description: string };
  };
};

async function getImpressumContent() {
  const { translations } = await getMetadataTranslations('legal');
  return (translations as unknown as LegalNamespace).impressum;
}

export async function generateMetadata(): Promise<Metadata> {
  const impressum = await getImpressumContent();
  return {
    title: impressum.metadata.title,
    description: impressum.metadata.description,
  };
}

export default async function ImpressumPage() {
  const impressum = await getImpressumContent();
  return <LegalDocument content={impressum} />;
}
