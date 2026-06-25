import { CommunityForm } from '@/components/features/communities/CommunityForm';
import { getCommunityAction } from '@/app/actions/community';
import { getCurrentUser } from '@/app/actions/auth';
import { notFound, redirect } from 'next/navigation';
import { type CommunityType } from '@/lib/prisma';

interface EditCommunityPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCommunityPage({ params }: Readonly<EditCommunityPageProps>) {
    const { id } = await params;

    const [communityRes, userRes] = await Promise.all([
        getCommunityAction(id),
        getCurrentUser()
    ]);

    if (!communityRes.success || !communityRes.data) {
        notFound();
    }

    const user = userRes.data?.user;
    if (!user || user.id !== communityRes.data.ownerId) {
        redirect(`/communities/${id}`);
    }

    const { data } = communityRes;

    // Transform API data to Form data
    const initialData = {
        name: data.name,
        description: data.description || '',
        type: data.type as Exclude<CommunityType, 'OTHER'>,
        city: data.city || '',
        country: data.country || '',
        website: data.website || '',
        foundingYear: data.foundingYear || undefined,
        acceptingNewMembers: data.acceptingNewMembers,
        coverImage: data.photoGallery?.[0] || '', // Use first photo as cover
        id: data.id
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <CommunityForm initialData={initialData} isEditMode={true} />
        </div>
    );
}
