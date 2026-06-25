import { redirect } from 'next/navigation';

export default async function LegacyGovernanceDetailRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/about/governance/${slug}`);
}