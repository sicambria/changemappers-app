'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui';
import { UserIcon, MapPinIcon } from 'lucide-react';
import { ConnectionRequestButton } from './ConnectionRequestButton';
import { getRecommendedConnectionsAction } from '@/app/actions/connection';
import { ActiveBadge } from '@/components/ui/ActiveBadge';

interface RecommendedUser {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
    city: string | null;

    archetypes: string[];
    isRecentlyActive?: boolean;
}

function removeUserById(prev: RecommendedUser[], userId: string): RecommendedUser[] {
    return prev.filter(u => u.id !== userId);
}

export function RecommendedUsersList() {
    const { t } = useTranslation(['profiles', 'common']);
    const [users, setUsers] = useState<RecommendedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const result = await getRecommendedConnectionsAction(20);
            if (result.success && result.data) {
                setUsers(result.data);
            }
            setIsLoading(false);
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => 
        (user.displayName || user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.city || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">{t('common:actions.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Search bar */}
            <div className="max-w-md mx-auto">
                <input
                    type="text"
                    placeholder={t('common:actions.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? t('common:status.noResults') : t('common:connections.noRecommendations')}
                    </p>
                    <Link href="/map" className="text-emerald-600 hover:underline mt-2 inline-block">
                        {t('common:connections.browseMap')}
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredUsers.map((user) => (
                        <Card 
                            key={user.id} 
                            className="hover:shadow-md transition-shadow"
                            data-testid={`user-card-${(user.displayName || user.name).toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '')}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <Link href={`/profile/${user.id}`}>
                                        <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                                            {user.profilePhoto ? (
                                                <Image
                                                    src={user.profilePhoto}
                                                    alt={user.displayName || user.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <UserIcon className="h-10 w-10 text-gray-400" />
                                            )}
                                        </div>
                                    </Link>

                                    <div className="w-full">
                                        <Link
                                            href={`/profile/${user.id}`}
                                            className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 transition-colors block truncate"
                                        >
                                            {user.displayName || user.name}
                                        </Link>
                                        <ActiveBadge show={user.isRecentlyActive} className="mt-2" />

                                        {user.city && (
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                                                <MapPinIcon className="h-3 w-3" />
                                                {user.city}
                                            </div>
                                        )}

                                        {user.archetypes?.length > 0 && (
                                            <p className="text-xs text-emerald-600 mt-1">
                                                {t(`individual.archetypes.${user.archetypes[0].toLowerCase().replaceAll('_', '')}`)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-full mt-2">
                                        <ConnectionRequestButton
                                            targetUserId={user.id}
                                            targetUserName={user.displayName || user.name}
                                            existingStatus="none"
                                            onSuccess={() => {
                                                // Remove user from list on success to avoid duplicate requests
                                                setUsers(prev => removeUserById(prev, user.id));
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
