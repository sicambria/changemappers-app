import { EventForm } from '@/components/features/events/EventForm';
import { getEventAction } from '@/app/actions/event';
import { getCurrentUser } from '@/app/actions/auth';
import { notFound, redirect } from 'next/navigation';

interface EditEventPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Readonly<EditEventPageProps>) {
    const { id } = await params;

    const [eventRes, userRes] = await Promise.all([
        getEventAction(id),
        getCurrentUser()
    ]);

    if (!eventRes.success || !eventRes.data) {
        notFound();
    }

    const user = userRes.data?.user;
    if (!user || user.id !== eventRes.data.host?.id) {
        redirect(`/events/${id}`);
    }

    const { data } = eventRes;

    // Transform API data to Form data
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : undefined;

    const initialData = {
        title: data.title,
        description: data.description || '',
        type: data.category === 'MEETUP' ? 'GATHERING' : data.category,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().split(' ')[0].substring(0, 5),
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        endTime: endDate ? endDate.toTimeString().split(' ')[0].substring(0, 5) : '',
        location: data.location || '',
        isOnline: data.isOnline,
        onlineLink: data.onlineLink || '',
        maxAttendees: data.capacity,
        isPublic: data.type === 'PUBLIC',
        coverImage: data.coverImage || '',
        id: data.id
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <EventForm initialData={initialData} isEditMode={true} currentUserId={user.id} />
        </div>
    );
}
