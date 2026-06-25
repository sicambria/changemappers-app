import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSocialIssueById } from '@/app/actions/social-issue';
import { getCurrentUser } from '@/app/actions/auth';
import { SocialIssueForm } from '../../create/SocialIssueForm';
import { getServerTranslation } from '@/lib/server-i18n';

interface EditSocialIssuePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('social-issues');
  return {
    title: t('editMetaTitle'),
  };
}

export default async function EditSocialIssuePage({ params }: Readonly<EditSocialIssuePageProps>) {
	const { id } = await params;

	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) {
		redirect(`/login?redirect=/social-issues/${id}/edit`);
	}

	const result = await getSocialIssueById(id);
	if (!result.success || !result.data) {
		notFound();
	}

	const issue = result.data;

	if (issue.createdById !== auth.data.user.id) {
		redirect(`/social-issues/${id}`);
	}

	const leanWastes = issue.leanWastes.filter((w) => !w.startsWith('HARM_'));
	const harmTypes = issue.leanWastes.filter((w) => w.startsWith('HARM_'));

	return (
		<div className="container mx-auto py-8 px-4">
			<SocialIssueForm
				issueId={id}
				initialData={{
					title: issue.title,
					description: issue.description ?? undefined,
					category: issue.category,
					severity: issue.severity,
					scope: (issue.scope ?? ''),
					isLocalizable: issue.isLocalizable,
					locationName: issue.locationName ?? undefined,
					latitude: issue.latitude ?? undefined,
					longitude: issue.longitude ?? undefined,
					relatedRdgs: issue.relatedRdgs.map(Number),
					leanWastes,
					harmTypes,
					sources: issue.sources,
					tags: issue.tags,
				}}
			/>
		</div>
	);
}
