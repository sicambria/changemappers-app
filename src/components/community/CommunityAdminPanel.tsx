'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Badge
} from '@/components/ui';
import {
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    Loader2
} from 'lucide-react';
import { getCommunityJoinRequestsAction, respondToJoinRequestAction } from '@/app/actions/community';
import { useAuth } from '@/components/providers';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface CommunityAdminPanelProps {
    communityId: string;
}

interface Request {
    id: string; // Member record ID (wait, findMany returns objects. The ID is not on the pivot usually in Prisma unless explicity defined. CommunityMember has `id` in schema? Let me check schema.)
    // Schema: model CommunityMember { id String @id ... } YES.
    userId: string;
    user: {
        id: string;
        name: string;
        profilePhoto?: string | null;
        email: string;
    };
    joinedAt: Date;
}

export default function CommunityAdminPanel({ communityId }: Readonly<CommunityAdminPanelProps>) {
    const { t, i18n } = useTranslation('communities');
    useAuth(); // _user not needed here
    const dateLocale = i18n.resolvedLanguage || 'en';
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        const result = await getCommunityJoinRequestsAction(communityId);
        if (result.success && result.data) {
            setRequests(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [communityId]);


    const handleRespond = async (userId: string, action: 'ACCEPT' | 'REJECT') => {
        setProcessing(userId);
        const result = await respondToJoinRequestAction(communityId, userId, action);

        if (result.success) {
            toast.success(result.message);
            // Remove from list
            setRequests(prev => prev.filter(r => r.userId !== userId));
        } else {
            toast.error(result.error);
        }
        setProcessing(null);
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;
    }

    if (requests.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('adminPanel.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-sm">{t('adminPanel.noPending')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t('adminPanel.title')}</CardTitle>
                    <Badge variant="secondary">{t('adminPanel.newCount', { count: requests.length })}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                                {req.user.profilePhoto ? (
                                    <Image src={req.user.profilePhoto} alt={req.user.name} fill className="object-cover" />
                                ) : (
                                    <UserIcon className="h-5 w-5 text-emerald-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">{req.user.name}</p>
                            <p className="text-xs text-gray-500">{new Date(req.joinedAt).toLocaleDateString(dateLocale)}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleRespond(req.userId, 'REJECT')}
                                disabled={!!processing}
                            >
                                {processing === req.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircleIcon className="h-4 w-4" />}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleRespond(req.userId, 'ACCEPT')}
                                disabled={!!processing}
                            >
                                {processing === req.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
