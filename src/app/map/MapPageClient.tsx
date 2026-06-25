'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DiscoveryMap, MapEntity } from '@/components/map';
import { EntityDetailsSidebar } from '@/components/planet/EntityDetailsSidebar';

interface MapPageClientProps {
    entities: MapEntity[];
}

export default function MapPageClient({ entities }: Readonly<MapPageClientProps>) {
    const { t } = useTranslation('map');
    const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* Page header - visible on mobile */}
            <div className="md:hidden px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('discover')}
                </p>
            </div>

            {/* Map container */}
            <div className="flex-1 relative">
                <DiscoveryMap
                    entities={entities}
                    initialCenter={[47.1625, 19.5033]}
                    initialZoom={6}
                    onEntityClick={setSelectedEntity}
                />
                {selectedEntity && (
                    <EntityDetailsSidebar
                        entity={selectedEntity}
                        onClose={() => setSelectedEntity(null)}
                    />
                )}
            </div>
        </div>
    );
}
