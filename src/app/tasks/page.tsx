import { getCurrentUser } from '@/lib/get-current-user';
import { getDefaultBoardForUserAction } from '@/app/actions/board';
import ClientRedirect from '@/components/shared/ClientRedirect';

export const dynamic = 'force-dynamic';

export default async function TasksRedirectPage() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return <ClientRedirect href="/login?redirect=/tasks" />;
  }

  const result = await getDefaultBoardForUserAction();

  if (result.success && result.data) {
    return <ClientRedirect href={`/tasks/${result.data.id}`} />;
  }

  return <ClientRedirect href="/tasks/personal" />;
}
