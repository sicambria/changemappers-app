'use client';

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createEntityIcon } from '@/lib/map-icon-builders';
import { EntityPreview } from './EntityPreview';
import type { MapEntity } from './map-entity-types';

const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

// Memoized marker child: keeps the Leaflet divIcon and the eventHandlers
// object referentially stable across DiscoveryMap re-renders (search
// keystrokes, filter/layer toggles, cluster interactions), so react-leaflet
// does not rebuild up to ~1,400 icons + handler closures per render
// (AUDIT-20260613-017). It only re-renders when its own entity (or the
// leaflet instance / locale t function) changes.
export const EntityMarker = memo(function EntityMarker({
    entity,
    leaflet,
    t,
    onEntityClick,
}: {
    entity: MapEntity;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    leaflet: any;
    t: (key: string, opts?: Record<string, unknown>) => string;
    onEntityClick?: (entity: MapEntity) => void;
}) {
    const icon = useMemo(() => createEntityIcon(entity, leaflet, t), [entity, leaflet, t]);
    const eventHandlers = useMemo(
        () => ({ click: () => onEntityClick?.(entity) }),
        [entity, onEntityClick],
    );

    return (
        <Marker
            position={[entity.latitude, entity.longitude]}
            icon={icon}
            title={entity.id}
            eventHandlers={eventHandlers}
        >
            {/* When the parent owns selection (e.g. the map page's details
                sidebar), suppress the inline popup so a marker click yields a
                single, consistent surface. Consumers without a click handler
                keep the quick-preview popup as a fallback. */}
            {!onEntityClick && (
                <Popup>
                    <EntityPreview entity={entity} />
                </Popup>
            )}
        </Marker>
    );
});
