'use client';

import type L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import {
  UsersIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  AlertTriangleIcon,
  RadioIcon
} from 'lucide-react';
import { safeAvatarCssUrl } from '@/lib/safe-avatar-url';
import { ClusterStarOverlay } from './ClusterStarOverlay';

import { Card } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { DefinitionsModal } from '@/components/features/glossary/DefinitionsModal';
import { hasAvailabilitySlot } from '@/lib/map-filters';
import type { MapEntity } from './map-entity-types';
import { MapControls } from './MapControls';
import { LayersPanel } from './LayersPanel';
import { FiltersPanel } from './FiltersPanel';
import { EntityPreview } from './EntityPreview';
import { EntityMarker } from './EntityMarker';

// Re-export the public surface that external consumers (tests, map barrel)
// import from this module.
export type { MapEntity } from './map-entity-types';
export { hasAvailabilitySlot } from '@/lib/map-filters';
export { EntityMarker } from './EntityMarker';

interface DiscoveryMapProps {
    entities?: MapEntity[];
    initialCenter?: [number, number];
    initialZoom?: number;
    onEntityClick?: (entity: MapEntity) => void;
}

// Dynamic import of Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const MarkerClusterGroup = dynamic(
    () => import('react-leaflet-cluster'),
    { ssr: false }
);

type LayerState = { id: string; enabled: boolean };
type MapFilters = {
    radius: number;
    archetype: string[];
    changemakeLevel: string;
    communityType: string;
    rdg: string[];
    availability: string[];
    skills: string[];
    values: string[];
    needs: string[];
    offers: string[];
};

// Layer id ⇄ entity type pairs for the layer-visibility gate.
const LAYER_ENTITY_TYPES: ReadonlyArray<readonly [string, string]> = [
    ['communities', 'community'],
    ['individuals', 'individual'],
    ['events', 'event'],
    ['issues', 'issue'],
    ['signals', 'signal'],
];

// Individual-only array-intersection filters: each pairs a filter key with the entity
// field it must intersect. Collapsing the six near-identical blocks into one loop keeps
// the predicate's cognitive complexity under budget (S3776) without changing behavior.
const INDIVIDUAL_ARRAY_FILTERS: ReadonlyArray<readonly [keyof MapFilters, keyof MapEntity]> = [
    ['archetype', 'archetypes'],
    ['rdg', 'rdgAreas'],
    ['skills', 'skills'],
    ['values', 'values'],
    ['needs', 'needs'],
    ['offers', 'offers'],
];

function matchesLayer(entity: MapEntity, layers: LayerState[]): boolean {
    for (const [layerId, entityType] of LAYER_ENTITY_TYPES) {
        if (entity.type === entityType && !layers.find(l => l.id === layerId)?.enabled) return false;
    }
    return true;
}

function matchesIndividualFilters(entity: MapEntity, filters: MapFilters): boolean {
    if (entity.type !== 'individual') return true;

    if (filters.changemakeLevel && entity.changemakeLevel !== filters.changemakeLevel) return false;

    for (const [filterKey, entityField] of INDIVIDUAL_ARRAY_FILTERS) {
        const selected = filters[filterKey] as string[];
        if (selected.length > 0) {
            const values = entity[entityField] as string[] | undefined;
            if (!selected.some(v => values?.includes(v))) return false;
        }
    }

    if (filters.availability.length > 0) {
        const hasMatch = filters.availability.some(slot => hasAvailabilitySlot(entity.availabilityDetails, slot));
        if (!hasMatch) return false;
    }

    return true;
}

function matchesSearch(entity: MapEntity, searchQuery: string): boolean {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = entity.name.toLowerCase().includes(query);
    const matchesDesc = entity.description?.toLowerCase().includes(query);
    const matchesTags = entity.tags?.some(tag => tag.toLowerCase().includes(query));
    return Boolean(matchesName || matchesDesc || matchesTags);
}

// Build the HTML for a single avatar circle within a cluster icon. Extracted so the
// icon builder's mapping callback stays shallow (avoids S2004 / keeps cc low).
function buildClusterAvatarCircle(
    marker: L.Marker,
    index: number,
    entityById: Map<string, MapEntity>,
): string {
    const entity = marker.options.title != null ? entityById.get(marker.options.title) : undefined;
    const avatar = entity ? safeAvatarCssUrl(entity.avatar) : null;
    const initial = entity ? entity.name.charAt(0).toUpperCase() : '?';
    const left = index * 16;
    const avatarBg = avatar ? `url('${avatar}') center/cover no-repeat,` : '';
    return `<div style="position:absolute;width:28px;height:28px;border-radius:50%;` +
        `background:${avatarBg}#38bdf8;` +
        `border:2px solid white;display:flex;align-items:center;justify-content:center;` +
        `color:white;font-weight:700;font-size:10px;font-family:sans-serif;` +
        `left:${left}px;top:12px;z-index:${2 - index}">${avatar ? '' : initial}</div>`;
}

// Minimal structural type for a leaflet.markercluster cluster — only the members
// used here. Avoids a runtime side-effect `import 'leaflet.markercluster'` (which
// references a global `L` and throws under jsdom/SSR module load) while keeping the
// extracted helpers fully typed.
type MarkerCluster = {
    getAllChildMarkers(): L.Marker[];
    getChildCount(): number;
    getLatLng(): L.LatLng;
    zoomToBounds(options?: { padding?: [number, number] }): void;
};

// Build the leaflet divIcon for a cluster. Module-scope so its complexity is not
// attributed to the DiscoveryMap component (S3776). Behavior identical to the inline
// iconCreateFunction, including the no-leaflet early return.
function buildClusterIcon(
    cluster: MarkerCluster,
    leaflet: typeof L,
    entityById: Map<string, MapEntity>,
): L.DivIcon {
    const markers = cluster.getAllChildMarkers();
    const count: number = cluster.getChildCount();
    const top2 = markers.slice(0, 2);
    const circles = top2.map((m: L.Marker, i: number) => buildClusterAvatarCircle(m, i, entityById)).join('');
    const badge = `<div style="position:absolute;bottom:0;right:0;` +
        `background:#0f172a;color:white;border-radius:9999px;padding:1px 5px;` +
        `font-size:10px;font-weight:700;font-family:sans-serif;border:1.5px solid white;` +
        `line-height:1.4">${count}</div>`;
    return leaflet.divIcon({
        html: `<div style="position:relative;width:52px;height:52px">${circles}${badge}</div>`,
        className: '',
        iconSize: [52, 52],
        iconAnchor: [26, 26],
    });
}

// Handle a cluster click: zoom into large clusters, otherwise open the star overlay.
// Module-scope so its complexity is not attributed to DiscoveryMap (S3776).
function handleClusterClick(
    e: L.LeafletMouseEvent,
    map: L.Map | null,
    entityById: Map<string, MapEntity>,
    setClusterStar: (star: { x: number; y: number; entities: MapEntity[] }) => void,
) {
    const cluster = e.layer as MarkerCluster;
    const count: number = cluster.getChildCount();
    if (!map) return;
    if (count > 12 && map.getZoom() < map.getMaxZoom()) {
        cluster.zoomToBounds({ padding: [50, 50] });
        return;
    }
    const childMarkers: L.Marker[] = cluster.getAllChildMarkers();
    const clusterEntities = childMarkers
        .map((m: L.Marker) => entityById.get(m.options.title as string))
        .filter((en): en is MapEntity => en != null);
    const point = map.latLngToContainerPoint(cluster.getLatLng());
    setClusterStar({ x: point.x, y: point.y, entities: clusterEntities });
}

// Main map component
export function DiscoveryMap({
    entities = [],
    initialCenter = [47.1625, 19.5033], // Hungary center
    initialZoom = 7,
    onEntityClick,
    archetypes: _initialArchetypes = [],
}: DiscoveryMapProps & { archetypes?: string[]; }) {
    const { t } = useTranslation('map');
    const [isClient, setIsClient] = useState(false);
    const [leaflet, setLeaflet] = useState<typeof L | null>(null);
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [clusterStar, setClusterStar] = useState<{ x: number; y: number; entities: MapEntity[] } | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Layer visibility state
  const [layers, setLayers] = useState([
    { id: 'communities', label: t('layers.communities'), enabled: true, icon: <UsersIcon className="h-4 w-4 text-emerald-600" /> },
    { id: 'individuals', label: t('layers.individuals'), enabled: true, icon: <UserIcon className="h-4 w-4 text-cyan-600" /> },
{ id: 'events', label: t('layers.events'), enabled: true, icon: <CalendarIcon className="h-4 w-4 text-teal-600" /> },
		{ id: 'issues', label: t('layers.issues'), enabled: false, icon: <AlertTriangleIcon className="h-4 w-4 text-red-600" /> },
		{ id: 'signals', label: t('layers.signals'), enabled: true, icon: <RadioIcon className="h-4 w-4 text-emerald-600" /> },
  ]);

  // Filters state
  const [filters, setFilters] = useState({
    radius: 100,
    archetype: [] as string[],
    changemakeLevel: '',
    communityType: '',
    rdg: [] as string[],
    availability: [] as string[],
    skills: [] as string[],
    values: [] as string[],
    needs: [] as string[],
    offers: [] as string[],
  });

    // Definitions Modal state
    const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(false);
    const [definitionsTerm, setDefinitionsTerm] = useState<string | undefined>(undefined);

    const openDefinitions = (term?: string) => {
        setDefinitionsTerm(term);
        setIsDefinitionsOpen(true);
    };

    // Ensure client-side only rendering and fix Leaflet icons
    useEffect(() => {
        setIsClient(true);

        // Fix Leaflet's default icon path issue in Next.js, then store instance
        import('leaflet').then((L) => {
            // @ts-expect-error - overriding Leaflet internal method
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
                iconUrl: '/images/leaflet/marker-icon.png',
                shadowUrl: '/images/leaflet/marker-shadow.png',
            });
            setLeaflet(L);
        });
    }, []);

    // Watch the container for size changes and keep Leaflet in sync.
    // This replaces the old fixed-timeout invalidateSize calls which were
    // unreliable when the flexbox layout resolved after Leaflet had already
    // initialized (causing the split-tile visual glitch on the homepage).
    useEffect(() => {
        if (!isClient || !containerRef.current) return;
        const observer = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isClient]);

  // Filter entities based on layers and filters. The per-entity predicate is split
  // into module-scope helpers (matchesLayer / matchesIndividualFilters / matchesSearch)
  // so no single function exceeds the cognitive-complexity budget (S3776); the AND of
  // the three checks reproduces the original short-circuit behavior exactly.
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) =>
      matchesLayer(entity, layers)
      && matchesIndividualFilters(entity, filters)
      && matchesSearch(entity, searchQuery)
    );
  }, [entities, layers, filters, searchQuery]);

  // C12 (2026-06-18 audit): id-indexed lookup so the cluster icon builder and
  // clusterclick handler resolve each child marker in O(1) instead of an O(n)
  // `filteredEntities.find()` per marker on every cluster repaint.
  const entityById = useMemo(
    () => new Map(filteredEntities.map((entity) => [entity.id, entity])),
    [filteredEntities],
  );

    const handleToggleLayer = (layerId: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
        ));
    };

    const handleFilterChange = (key: string, value: MapFilters[keyof MapFilters]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleZoomIn = () => {
        if (mapRef.current) {
            mapRef.current.zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current) {
            mapRef.current.zoomOut();
        }
    };

    const handleLocate = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (mapRef.current) {
                        mapRef.current.setView(
                            [position.coords.latitude, position.coords.longitude],
                            12
                        );
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                }
            );
        }
    };

    if (!isClient) {
        return (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 animate-pulse" />
                    {t('loading')}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full">
            {viewMode === 'map' ? (
                <MapContainer
                    center={initialCenter}
                    zoom={initialZoom}
                    className="w-full h-full z-0"
                    ref={mapRef}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MarkerClusterGroup
                        chunkedLoading
                        spiderfyOnMaxZoom={false}
                        zoomToBoundsOnClick={false}
                        showCoverageOnHover={false}
                        iconCreateFunction={(cluster: MarkerCluster) => buildClusterIcon(cluster, leaflet!, entityById)}
                        // onClick maps to leaflet.markercluster's "clusterclick" event
                        onClick={(e: L.LeafletMouseEvent) => handleClusterClick(e, mapRef.current, entityById, setClusterStar)}
                    >
                        {leaflet && filteredEntities.map((entity) => (
                            <EntityMarker
                                key={entity.id}
                                entity={entity}
                                leaflet={leaflet}
                                t={t}
                                onEntityClick={onEntityClick}
                            />
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            ) : (
                <ScrollArea className="w-full h-full bg-slate-50 dark:bg-gray-900 p-4 pt-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto pb-20">
                        {filteredEntities.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                {t('listView.noResults')}
                            </div>
                        ) : (
                            filteredEntities.map(entity => (
                                <Card key={entity.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                                    <div className="p-4">
                                        <EntityPreview entity={entity} />
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            )}

            {/* Map controls */}
            <MapControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onLocate={handleLocate}
                onToggleLayers={() => {
                    setShowLayersPanel(!showLayersPanel);
                    setShowFiltersPanel(false);
                }}
                onToggleFilters={() => {
                    setShowFiltersPanel(!showFiltersPanel);
                    setShowLayersPanel(false);
                }}
                showLayersPanel={showLayersPanel}
                showFiltersPanel={showFiltersPanel}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                viewMode={viewMode}
                onToggleView={setViewMode}
            />

            {/* Layers panel */}
            <LayersPanel
                isOpen={showLayersPanel}
                onClose={() => setShowLayersPanel(false)}
                layers={layers}
                onToggleLayer={handleToggleLayer}
            />

            {/* Filters panel */}
            <FiltersPanel
                isOpen={showFiltersPanel}
                onClose={() => setShowFiltersPanel(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                onOpenDefinitions={openDefinitions}
            />

            {/* Definitions Modal */}
            <DefinitionsModal
                isOpen={isDefinitionsOpen}
                onClose={() => setIsDefinitionsOpen(false)}
                initialTerm={definitionsTerm}
            />

            {/* Cluster star expansion overlay */}
            {clusterStar && (
                <ClusterStarOverlay
                    x={clusterStar.x}
                    y={clusterStar.y}
                    entities={clusterStar.entities}
                    onSelect={(entity) => onEntityClick?.(entity as MapEntity)}
                    onClose={() => setClusterStar(null)}
                />
            )}
        </div>
    );
}
