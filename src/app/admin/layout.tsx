// Admin Layout — centralized access guard for all /admin routes
// Only explicit admin users can access admin pages

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { AdminLayoutWrapper } from '@/components/features/admin/AdminLayoutWrapper';

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const userResult = await getCurrentUser();
    const user = userResult.data?.user;

    if (!user?.isAdmin) {
        redirect('/');
    }

    return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
