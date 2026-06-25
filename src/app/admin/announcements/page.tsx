import { adminGetAnnouncements, adminDeleteAnnouncement } from '@/app/actions/announcements';
import Link from 'next/link';
import { PlusIcon, EditIcon, TrashIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { getServerTranslation } from '@/lib/server-i18n';

export default async function AnnouncementsAdminPage() {
  const { t, lang } = await getServerTranslation('admin');
  const announcements = await adminGetAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Link
          href="/admin/announcements/create"
          className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t('announcements.list.new')}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('announcements.list.type')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('announcements.list.title')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('announcements.list.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('announcements.list.timing')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('announcements.list.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {announcements.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  {a.type === 'SECURITY' ? (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangleIcon className="h-4 w-4" />
                      {t('announcements.list.security')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <InfoIcon className="h-4 w-4" />
                      Info
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{a.title}</div>
                  <div className="max-w-xs truncate text-sm text-gray-500">{a.content}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {a.isActive ? t('announcements.list.active') : t('announcements.list.inactive')}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {a.isPermanent ? (
                    t('announcements.list.permanent')
                  ) : (
                    <>
                      {a.startDate?.toLocaleDateString(lang)} - {a.endDate?.toLocaleDateString(lang) || t('announcements.list.notAvailable')}
                    </>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/announcements/${a.id}/edit`}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Link>
                    <form action={async () => {
                      'use server';
                      await adminDeleteAnnouncement(a.id);
                    }}>
                      <button type="submit" className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  {t('announcements.list.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
