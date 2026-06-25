import { Metadata } from 'next';
import { SocialIssueForm } from './SocialIssueForm';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('social-issues');
  return {
    title: t('createMetaTitle'),
    description: t('createMetaDescription'),
  };
}

export default function CreateSocialIssuePage() {
	return (
		<div className="container mx-auto py-8 px-4">
			<SocialIssueForm />
		</div>
	);
}
