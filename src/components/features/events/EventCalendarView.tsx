'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { hu } from 'date-fns/locale/hu';
import { es } from 'date-fns/locale/es';
import { useLanguage } from '@/components/providers/LanguageProvider';

const locales = { en: enUS, hu, es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EventCalendarViewProps {
  events: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate?: string | null;
  }>;
}

export function EventCalendarView({ events }: Readonly<EventCalendarViewProps>) {
  const { t } = useTranslation(['events', 'common']);
  const { language } = useLanguage();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

  const calendarEvents = useMemo(() => events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startDate),
    end: event.endDate ? new Date(event.endDate) : new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000),
    resource: event,
  })), [events]);

  const handleSelectEvent = (event: { id: string }) => {
    router.push(`/events/${event.id}`);
  };

  return (
    <div className="h-[600px] bg-white dark:bg-gray-900 rounded-xl shadow p-4">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        date={date}
        onNavigate={setDate}
        view={view}
        onView={setView}
        onSelectEvent={handleSelectEvent}
        culture={language}
        messages={{
          next: t('calendar.next'),
          previous: t('calendar.previous'),
          today: t('calendar.today'),
          month: t('calendar.month'),
          week: t('calendar.week'),
          day: t('calendar.day'),
          agenda: t('calendar.agenda'),
          date: t('calendar.date'),
          time: t('calendar.time'),
          event: t('calendar.event'),
          noEventsInRange: t('calendar.noEventsInRange'),
        }}
      />
    </div>
  );
}
