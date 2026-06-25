import type { Metadata } from 'next';
import { LegalDocument, type LegalDocumentContent } from '@/components/legal/LegalDocument';
import { getMetadataTranslations } from '@/lib/server-i18n';

type LegalNamespace = {
  privacy: LegalDocumentContent & {
    metadata: { title: string; description: string };
  };
};

async function getPrivacyContent() {
  const { translations } = await getMetadataTranslations('legal');
  return (translations as unknown as LegalNamespace).privacy;
}

export async function generateMetadata(): Promise<Metadata> {
  const privacy = await getPrivacyContent();
  return {
    title: privacy.metadata.title,
    description: privacy.metadata.description,
  };
}

export default async function PrivacyPage() {
  const privacy = await getPrivacyContent();
  return <LegalDocument content={privacy} />;
}
