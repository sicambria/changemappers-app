'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
    Button,
    Input
} from '@/components/ui';
import { EventCard } from './EventCard';
import {
    CalendarIcon,
    SearchIcon,
    ListIcon,
    PlusIcon
} from 'lucide-react';

const EventForm = dynamic(() => import('./EventForm').then((mod) => mod.EventForm), { ssr: false });
const EventCalendarView = dynamic(() => import('./EventCalendarView').then((mod) => mod.EventCalendarView), { ssr: false });

type TimeFilter = 'UPCOMING' | 'THIS_WEEK' | 'THIS_MONTH' | 'NEXT_MONTH' | 'PAST';

const TIME_FILTERS: TimeFilter[] = ['UPCOMING', 'THIS_WEEK', 'THIS_MONTH', 'NEXT_MONTH', 'PAST'];
const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
    UPCOMING: 'filters.upcoming',
    THIS_WEEK: 'filters.this_week',
    THIS_MONTH: 'filters.this_month',
    NEXT_MONTH: 'filters.next_month',
    PAST: 'filters.past',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EventsPageClient({ initialEvents = [], renderedAt }: Readonly<{ initialEvents?: any[]; renderedAt: string }>) {
  const { t } = useTranslation(['events', 'common']);
  const { language } = useLanguage();
  const router = useRouter();
    const searchParams = useSearchParams();
    
    // Derive viewMode from URL search parameters
    const viewMode = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';
    
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('UPCOMING');
    const [causeFilter, setCauseFilter] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Function to change view mode by updating search params
    const handleViewModeChange = (mode: 'list' | 'calendar') => {
        const params = new URLSearchParams(searchParams);
        if (mode === 'calendar') {
            params.set('view', 'calendar');
        } else {
            params.delete('view');
        }
        router.push(`/events?${params.toString()}`);
    };

    const availableCauses = useMemo(() => {
        const causes = new Map<string, string>();

        for (const event of initialEvents) {
            for (const cause of event.causes ?? []) {
                if (cause?.id && cause?.title) {
                    causes.set(cause.id, cause.title);
                }
            }
        }

        return Array.from(causes, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title, language));
    }, [initialEvents, language]);

    // Filter events
    const filteredEvents = useMemo(() => {
        const now = new Date(renderedAt);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const startOfFollowingMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);

        return initialEvents.filter(event => {
            const startDate = new Date(event.startDate);
            const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;
            const matchesCause = !causeFilter || event.causes?.some((cause: { id?: string }) => cause.id === causeFilter);
            if (!matchesCause) return false;

            if (timeFilter === 'UPCOMING') return startDate >= now;
            if (timeFilter === 'THIS_WEEK') return startDate >= startOfWeek && startDate < endOfWeek;
            if (timeFilter === 'THIS_MONTH') return startDate >= startOfMonth && startDate < startOfNextMonth;
            if (timeFilter === 'NEXT_MONTH') return startDate >= startOfNextMonth && startDate < startOfFollowingMonth;
            if (timeFilter === 'PAST') return startDate < now;
            return true;
        });
    }, [initialEvents, searchQuery, timeFilter, causeFilter, renderedAt]);


    return (
        <div className="mx-auto max-w-7xl overflow-hidden px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('subtitle')}
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon className="h-4 w-4" />
                    {t('create')}
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex min-w-0 flex-col gap-4 mb-8 sm:flex-row sm:flex-wrap">
                <div className="relative min-w-0 flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder={t('search.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex min-w-0 flex-wrap gap-2">
                    {TIME_FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setTimeFilter(filter)}
                            className={(timeFilter === filter
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                                : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800') + ' min-w-0 rounded-md border px-3 py-2 text-sm transition-colors'}
                        >
                            {t(TIME_FILTER_LABELS[filter])}
                        </button>
                    ))}
                </div>
                <div className="flex min-w-0 flex-wrap gap-2">
                    {availableCauses.length > 0 && (
                        <label className="min-w-0 flex-1 sm:flex-none">
                            <span className="sr-only">{t('filters.cause')}</span>
                            <select
                                value={causeFilter}
                                onChange={(event) => setCauseFilter(event.target.value)}
                                className="h-10 w-full max-w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                            >
                                <option value="">{t('filters.allCauses')}</option>
                                {availableCauses.map((cause) => (
                                    <option key={cause.id} value={cause.id}>{cause.title}</option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <button
                            onClick={() => handleViewModeChange('list')}
                            className={`p-2 transition-colors duration-200 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            aria-label={t('viewMode.list')}
                        >
                            <ListIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => handleViewModeChange('calendar')}
                            className={`p-2 transition-colors duration-200 ${viewMode === 'calendar' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            aria-label={t('viewMode.calendar')}
                        >
                            <CalendarIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content View */}
            {viewMode === 'list' ? (
                // LIST VIEW
                <div className="space-y-4">
                    {filteredEvents.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    compact={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('search.noResults')}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                // CALENDAR VIEW
                <EventCalendarView events={filteredEvents} />
            )}

            {/* Create Event Modal */}
            {isCreateModalOpen && (
                <EventForm
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}
        </div>
    );
}
