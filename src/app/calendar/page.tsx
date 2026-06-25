import ClientRedirect from '@/components/shared/ClientRedirect';

// /calendar → redirect to events in calendar view
export default function CalendarPage() {
    return <ClientRedirect href="/events?view=calendar" />;
}
