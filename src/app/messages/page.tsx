
import ChatInterface from '@/components/features/chat/ChatInterface';

interface MessagesPageProps {
    searchParams?: Promise<{
        userId?: string;
        name?: string;
    }>;
}

export default async function MessagesPage({ searchParams }: Readonly<MessagesPageProps>) {
    const params = await searchParams;

    return (
        <div className="container mx-auto py-8">
            <ChatInterface
                initialUserId={params?.userId}
                initialUserName={params?.name}
            />
        </div>
    );
}
