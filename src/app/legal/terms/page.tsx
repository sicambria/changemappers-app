import type { Metadata } from 'next';
import { LegalDocument, type LegalDocumentContent } from '@/components/legal/LegalDocument';
import { getMetadataTranslations } from '@/lib/server-i18n';

type LegalNamespace = {
  terms: LegalDocumentContent & {
    metadata: { title: string; description: string };
  };
};

async function getTermsContent() {
  const { translations } = await getMetadataTranslations('legal');
  return (translations as unknown as LegalNamespace).terms;
}

export async function generateMetadata(): Promise<Metadata> {
  const terms = await getTermsContent();
  return {
    title: terms.metadata.title,
    description: terms.metadata.description,
  };
}

export default async function TermsPage() {
  const terms = await getTermsContent();
  return <LegalDocument content={terms} />;
}
