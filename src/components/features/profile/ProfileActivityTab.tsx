'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui';
import { HeartIcon, CalendarIcon } from 'lucide-react';

export function ProfileActivityTab({ connectionCount }: Readonly<{ connectionCount: number }>) {
    const { t } = useTranslation(['profiles', 'common']);
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <section id="connections">
                <div className="flex items-center gap-2 mb-3">
                    <HeartIcon className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.connections.title')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 text-center py-8">
                        <p className="text-3xl font-bold text-emerald-600 mb-1">{connectionCount}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('individual.connections.count', { count: connectionCount })}
                        </p>
                    </CardContent>
                </Card>
            </section>

            <section id="activity-log">
                <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.activity.title')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">{t('individual.activity.empty')}</p>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
