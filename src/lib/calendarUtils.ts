export interface GoogleCalendarEvent {
    title: string;
    description: string;
    location?: string;
    startDate: string | Date;
    endDate?: string | Date;
    isAllDay?: boolean;
}

/**
 * Generates a Google Calendar link for a specific event
 */
export function generateGoogleCalendarUrl(event: GoogleCalendarEvent): string {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';

    // Helper to format date to YYYYMMDDThhmmssZ
    const formatDate = (date: string | Date, isAllDay = false): string => {
        const d = new Date(date);

        if (isAllDay) {
            // YYYYMMDD
            return d.toISOString().replaceAll(/[-:]/g, '').split('T')[0];
        }

        // YYYYMMDDThhmmssZ
        return d.toISOString().replaceAll(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(event.startDate, event.isAllDay);
    const end = event.endDate
        ? formatDate(event.endDate, event.isAllDay)
        : formatDate(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000), event.isAllDay); // Default to 1 hour

    const params = new URLSearchParams({
        text: event.title,
        dates: `${start}/${end}`,
        details: event.description || '',
        location: event.location || '',
        trp: 'false', // Busy
        sprop: 'website:https://ujfold.hu', // Source property
    });

    return `${baseUrl}&${params.toString()}`;
}
