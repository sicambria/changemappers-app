'use client';

// Communities listing client component
// Displays server-fetched communities with client-side search filtering

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
    Card,
    CardContent,
    Button,
    Input
} from '@/components/ui';
import {
    UsersIcon,
    MapPinIcon,
    SearchIcon,
    HeartIcon,
    PlusIcon
} from 'lucide-react';
import type { CommunityDirectoryItem } from '@/lib/community-contracts';

interface CommunitiesPageClientProps {
    communities: CommunityDirectoryItem[];
}

export function CommunitiesPageClient({ communities }: Readonly<CommunitiesPageClientProps>) {
    const { t } = useTranslation(['profiles', 'common', 'map']);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCommunities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return communities;

        return communities.filter((community) =>
            [community.name, community.description, community.city, community.country]
                .some((field) => field?.toLowerCase().includes(query))
        );
    }, [communities, searchQuery]);

    const communityTypeLabels: Record<string, string> = {
        NATURE_CONNECTED_ECO_HUB: t('community.types.natureConnectedEcoHub', 'Nature-connected eco hub'),
        HEALING_SANCTUARY: t('community.types.healingSanctuary', 'Healing sanctuary'),
        INCLUSIVE_SUPPORT_NETWORK: t('community.types.inclusiveSupportNetwork', 'Inclusive support network'),
        CREATIVE_ARTS_COLONY: t('community.types.creativeArtsColony', 'Creative arts colony'),
        EGALITARIAN_LIVING: t('community.types.egalitarianLiving', 'Egalitarian living community'),
        SPIRITUAL_HAVEN: t('community.types.spiritualHaven', 'Spiritual haven'),
        KNOWLEDGE_HUB: t('community.types.knowledgeHub', 'Knowledge hub'),
        NOMADIC_NETWORK: t('community.types.nomadicNetwork', 'Nomadic network'),
        REGENERATIVE_ECONOMIC: t('community.types.regenerativeEconomic', 'Regenerative economic community'),
        VISIONARY_MODEL_CITY: t('community.types.visionaryModelCity', 'Visionary model city'),
        EARTH_REGENERATION_CENTER: t('community.types.earthRegenerationCenter', 'Earth regeneration center'),
        FRONTLINE_ACTIVIST: t('community.types.frontlineActivist', 'Frontline activist'),
        OTHER: t('community.types.other', 'Other'),
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('common:nav.communities')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('common:communitiesPage.subtitle')}
                </p>
            </div>

            {/* Search and actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder={t('map:search.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Link href="/communities/create">
                    <Button>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        {t('common:communitiesPage.newCommunity')}
                    </Button>
                </Link>
            </div>

            {/* Communities Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCommunities.map((community) => {
                    const location = [community.city, community.country].filter(Boolean).join(', ');

                    return (
                        <Link key={community.id} href={`/communities/${community.id}`}>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                                            <UsersIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        {community.isAcceptingMembers && (
                                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full">
                                                {t('community.acceptingMembers')}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">
                                        {community.name}
                                    </h3>

                                    {community.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {community.description}
                                        </p>
                                    )}

                                    {location && (
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="h-4 w-4" />
                                                {location}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {communityTypeLabels[community.type] ?? communityTypeLabels.OTHER}
                                        </span>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                                <UsersIcon className="h-4 w-4" />
                                                {community.memberCount}
                                            </span>
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                <HeartIcon className="h-4 w-4" />
                                                {community.appreciateCount}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {communities.length === 0 ? (
                <div className="text-center py-12" data-testid="communities-empty-state">
                    <UsersIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('common:communitiesPage.emptyTitle')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {t('common:communitiesPage.emptyDescription')}
                    </p>
                    <Link href="/communities/create">
                        <Button>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            {t('common:communitiesPage.emptyCta')}
                        </Button>
                    </Link>
                </div>
            ) : filteredCommunities.length === 0 && (
                <div className="text-center py-12" data-testid="communities-no-results">
                    <SearchIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('common:communitiesPage.noResults')}
                    </p>
                </div>
            )}
        </div>
    );
}
