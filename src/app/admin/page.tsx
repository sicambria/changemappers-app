// Admin Dashboard - Server Component
// Access guard handled by admin layout.tsx

import { Suspense } from 'react';
import { AdminDashboardClient } from '@/components/features/admin/AdminDashboardClient';
import { getServerTranslation } from '@/lib/server-i18n';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default async function AdminPage() {
    const { t } = await getServerTranslation('admin');

    return (
        <Suspense fallback={<div className="p-8 text-center">{t('dashboard.loading')}</div>}>
            <ErrorBoundary componentName="AdminDashboard">
                <AdminDashboardClient />
            </ErrorBoundary>
        </Suspense>
    );
}
