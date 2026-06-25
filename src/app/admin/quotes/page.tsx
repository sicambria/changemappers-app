import { adminGetQuotesAction } from '@/app/actions/admin/quotes';
import { QuotesAdminClient } from './QuotesAdminClient';

export default async function QuotesAdminPage() {
  const result = await adminGetQuotesAction();
  const quotes = result.success && result.data ? result.data : [];

  return <QuotesAdminClient initialQuotes={quotes} />;
}
