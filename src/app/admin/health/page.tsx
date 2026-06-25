import { prisma } from '@/lib/prisma';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('admin');
  return {
    title: t('health.metaTitle'),
    description: t('health.metaDescription'),
  };
}

// Access guard handled by admin layout.tsx
export default async function AdminHealthPage() {
  const { t } = await getServerTranslation('admin');

  // Get latest health snapshots per community
  const snapshots = await prisma.communityHealthSnapshot.findMany({
    distinct: ['communityId'],
    orderBy: { snapshotAt: 'desc' },
    take: 50,
    select: {
      id: true,
      communityId: true,
      deliveringCount: true,
      buildingCount: true,
      betweenCount: true,
      reflectingCount: true,
      restingCount: true,
      totalActiveMembers: true,
      alertTriggered: true,
    },
  });

  const totals = snapshots.reduce(
    (acc, s) => ({
      delivering: acc.delivering + s.deliveringCount,
      building: acc.building + s.buildingCount,
      between: acc.between + s.betweenCount,
      reflecting: acc.reflecting + s.reflectingCount,
      resting: acc.resting + s.restingCount,
      total: acc.total + s.totalActiveMembers,
    }),
    { delivering: 0, building: 0, between: 0, reflecting: 0, resting: 0, total: 0 }
  );

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
        {[
          { label: t('health.states.delivering'), value: totals.delivering, color: 'bg-emerald-100 text-emerald-800' },
          { label: t('health.states.building'), value: totals.building, color: 'bg-blue-100 text-blue-800' },
          { label: t('health.states.between'), value: totals.between, color: 'bg-yellow-100 text-yellow-800' },
          { label: t('health.states.reflecting'), value: totals.reflecting, color: 'bg-purple-100 text-purple-800' },
          { label: t('health.states.resting'), value: totals.resting, color: 'bg-gray-100 text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('health.table.community')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('health.table.total')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('health.table.reflecting')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('health.table.resting')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('health.table.alert')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {snapshots.map((s) => (
              <tr key={s.id} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.communityId}</td>
                <td className="px-4 py-3 text-right">{s.totalActiveMembers}</td>
                <td className="px-4 py-3 text-right">{s.reflectingCount}</td>
                <td className="px-4 py-3 text-right">{s.restingCount}</td>
                <td className="px-4 py-3 text-right">
                  {s.alertTriggered ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      {t('health.alert')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {t('health.ok')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {snapshots.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {t('health.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
