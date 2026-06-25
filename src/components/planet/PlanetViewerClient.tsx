'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { CalendarDays, MessageSquare } from 'lucide-react';
import type { MapEntity } from '@/app/actions/map';
import { ClusterStarOverlay } from '@/components/map/ClusterStarOverlay';
import { type FeedPost } from '@/components/features/feed/FeedList';
import {
    AVAILABILITY_OPTIONS,
    NEEDS_OPTIONS,
    OFFERS_OPTIONS,
    SKILLS_OPTIONS,
    VALUES_OPTIONS,
} from '@/lib/profile-options';
import {
    ALL_ARCHETYPES,
    ALL_MARKER_TYPES,
    ALL_RDGS,
    ARCHETYPE_LABELS,
    CHANGEMAKE_LEVEL_OPTIONS,
    COMMUNITY_TYPE_OPTIONS,
    availabilityValues,
    clusterIndividuals,
    createEmptyAdvancedFilters,
    entityPointColor,
    entityPointSize,
    localizedFilterLabel,
    matchesAny,
    matchesRdgFilter,
    mergeOptions,
    uniqueOptions,
    type AdvancedPlanetFilterKey,
    type FilterOption,
    type MarkerType,
    type PlanetFilterKey,
} from '@/lib/planet-entity-helpers';
import { buildPlanetGlobeHtmlElement } from '@/lib/planet-globe-html';
import { FilterPanel } from './PlanetFilterPanel';
import { EntityDetailsSidebar } from './EntityDetailsSidebar';
import {
    PlanetFeedSidebar,
    PlanetEventsSidebar,
    type PlanetEvent,
    type PlanetSidePanel,
} from './PlanetSidebars';

// Dynamically import the Globe to prevent server-side rendering issues with Three.js
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });
// Dynamically import the DiscoveryMap as a fallback
const DiscoveryMap = dynamic(() => import('@/components/map/DiscoveryMap').then((mod) => mod.DiscoveryMap), { ssr: false });

type PlanetViewerClientProps = {
    entities: MapEntity[];
    userLocation?: { lat: number; lng: number } | null;
    initialFeedPosts?: FeedPost[];
    initialFeedNextCursor?: string | null;
    initialEvents?: PlanetEvent[];
};

export function PlanetViewerClient({
    entities,
    userLocation,
    initialFeedPosts = [],
    initialFeedNextCursor = null,
    initialEvents = [],
}: Readonly<PlanetViewerClientProps>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isLowEndDevice, setIsLowEndDevice] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const [dims, setDims] = useState({ width: 800, height: 600 });
    const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [activeSidePanel, setActiveSidePanel] = useState<PlanetSidePanel | null>(null);
    const [activePlanetCluster, setActivePlanetCluster] = useState<{ x: number; y: number; entities: MapEntity[] } | null>(null);
    // Filter state
    const [activeTypes, setActiveTypes] = useState<Set<MarkerType>>(new Set(ALL_MARKER_TYPES));
    const [activeArchetypes, setActiveArchetypes] = useState<Set<string>>(new Set());
    const [activeRdgs, setActiveRdgs] = useState<Set<string>>(new Set());
    const [advancedFilters, setAdvancedFilters] = useState<Record<AdvancedPlanetFilterKey, Set<string>>>(createEmptyAdvancedFilters);

    const { t } = useTranslation('map');
    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
    const { language } = useLanguage();

    const filterOptions = useMemo<Record<PlanetFilterKey, FilterOption[]>>(() => ({
        archetypes: ALL_ARCHETYPES.map((value) => ({ value, label: ARCHETYPE_LABELS[value] ?? value })),
        rdgs: ALL_RDGS.map((value) => ({ value, label: value })),
        communityTypes: mergeOptions(
            COMMUNITY_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
            uniqueOptions(entities.map((entity) => entity.communityType)),
        ),
        changemakeLevels: CHANGEMAKE_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        skills: mergeOptions(SKILLS_OPTIONS.map((value) => ({ value, label: value })), uniqueOptions(entities.flatMap((entity) => entity.skills ?? []))),
        offers: mergeOptions(OFFERS_OPTIONS.map((value) => ({ value, label: value })), uniqueOptions(entities.flatMap((entity) => entity.offers ?? []))),
        needs: mergeOptions(NEEDS_OPTIONS.map((value) => ({ value, label: value })), uniqueOptions(entities.flatMap((entity) => entity.needs ?? []))),
        values: mergeOptions(VALUES_OPTIONS.map((value) => ({ value, label: value })), uniqueOptions(entities.flatMap((entity) => entity.values ?? []))),
        availability: mergeOptions(
            AVAILABILITY_OPTIONS.map((option) => ({
                value: option.value,
                label: localizedFilterLabel(option, language),
            })),
            uniqueOptions(entities.flatMap((entity) => availabilityValues(entity.availabilityDetails))),
        ),
        tags: uniqueOptions(entities.flatMap((entity) => entity.tags ?? [])),
    }), [entities, language, t]);

    const activeFilters = useMemo<Record<PlanetFilterKey, Set<string>>>(() => ({
        archetypes: activeArchetypes,
        rdgs: activeRdgs,
        ...advancedFilters,
    }), [activeArchetypes, activeRdgs, advancedFilters]);

    useEffect(() => {
        setMounted(true);
        // Simple heuristic for low-end device: mobile devices often have lower hardware concurrency
        if (globalThis.window !== undefined) {
            const isMobile = globalThis.matchMedia('(max-width: 768px)').matches;
            const cores = navigator.hardwareConcurrency || 4;
            if (isMobile && cores <= 4) setIsLowEndDevice(true);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const measure = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                if (width > 0 && height > 0) setDims({ width, height });
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [mounted]);

    useEffect(() => {
        if (mounted && !useFallback && globeRef.current) {
            try {
                const renderer = globeRef.current.renderer?.();
                if (renderer) {
                    renderer.setPixelRatio(window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 1.5) : 1);
                }
                const controls = globeRef.current.controls?.();
                if (controls) controls.enableZoom = false;
            } catch (e) {
                console.error("Globe renderer error", e);
                setUseFallback(true);
                toast.error(tRef.current('planet.globeUnavailable'));
            }

            if (userLocation) {
                setTimeout(() => {
                    globeRef.current?.pointOfView?.({ lat: userLocation.lat, lng: userLocation.lng, altitude: 2 }, 2000);
                }, 1000);
            }
        }
    }, [mounted, userLocation, useFallback]);

    // Filter helpers
    const toggleType = useCallback((t: MarkerType) => {
        setActiveTypes(prev => {
            const next = new Set(prev);
            if (next.has(t)) { next.delete(t); } else { next.add(t); }
            return next;
        });
    }, []);

    const toggleArchetype = useCallback((a: string) => {
        setActiveArchetypes(prev => {
            const next = new Set(prev);
            if (next.has(a)) { next.delete(a); } else { next.add(a); }
            return next;
        });
    }, []);

    const toggleRdg = useCallback((r: string) => {
        setActiveRdgs(prev => {
            const next = new Set(prev);
            if (next.has(r)) { next.delete(r); } else { next.add(r); }
            return next;
        });
    }, []);

    const toggleAdvancedFilter = useCallback((key: PlanetFilterKey, value: string) => {
        if (key === 'archetypes') {
            toggleArchetype(value);
            return;
        }
        if (key === 'rdgs') {
            toggleRdg(value);
            return;
        }
        setAdvancedFilters((prev) => {
            const next = { ...prev, [key]: new Set(prev[key]) };
            if (next[key].has(value)) { next[key].delete(value); } else { next[key].add(value); }
            return next;
        });
    }, [toggleArchetype, toggleRdg]);

    const clearFilters = useCallback(() => {
        setActiveTypes(new Set(ALL_MARKER_TYPES));
        setActiveArchetypes(new Set());
        setActiveRdgs(new Set());
        setAdvancedFilters(createEmptyAdvancedFilters());
    }, []);

    const handleEntitySelect = useCallback((entity: MapEntity & { lat?: number; lng?: number }) => {
        setSelectedEntity(entity);
        const lat = entity.lat ?? entity.latitude;
        const lng = entity.lng ?? entity.longitude;
        if (typeof lat === 'number' && typeof lng === 'number') {
            globeRef.current?.pointOfView?.({ lat, lng, altitude: 0.45 }, 900);
        }
    }, []);

    const handleClusterExpand = useCallback((entities: MapEntity[], clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setActivePlanetCluster({ x: clientX - rect.left, y: clientY - rect.top, entities });
    }, []);

    // Apply filters
    const filteredEntities = useMemo(() => {
        return entities.filter(e => {
            if (!activeTypes.has(e.type as MarkerType)) return false;
            if (!matchesAny(e.archetypes ?? [], activeArchetypes)) return false;
            if (!matchesRdgFilter(e.rdgAreas, activeRdgs)) return false;
            if (!matchesAny([e.communityType], advancedFilters.communityTypes)) return false;
            if (!matchesAny([e.changemakeLevel], advancedFilters.changemakeLevels)) return false;
            if (!matchesAny(e.skills ?? [], advancedFilters.skills)) return false;
            if (!matchesAny(e.offers ?? [], advancedFilters.offers)) return false;
            if (!matchesAny(e.needs ?? [], advancedFilters.needs)) return false;
            if (!matchesAny(e.values ?? [], advancedFilters.values)) return false;
            if (!matchesAny(availabilityValues(e.availabilityDetails), advancedFilters.availability)) return false;
            if (!matchesAny(e.tags ?? [], advancedFilters.tags)) return false;
            return true;
        });
    }, [entities, activeTypes, activeArchetypes, activeRdgs, advancedFilters]);

    // Individual people → circular HTML avatar elements (memoized to avoid
    // recreating DOM nodes on every resize-triggered re-render)
    const individualPoints = useMemo(
        () =>
            filteredEntities
                .filter(e => e.latitude != null && e.longitude != null && e.type === 'individual')
                .map(e => ({ ...e, lat: e.latitude, lng: e.longitude })),
        [filteredEntities],
    );

    // Geographic clusters of individual points for the globe (groups within ~90 km)
    const clusteredPlanetPoints = useMemo(
        () => clusterIndividuals(individualPoints),
        [individualPoints],
    );

    // Communities & events → simple coloured spheres
    const pointsData = useMemo(
        () =>
            filteredEntities
                .filter(e => e.latitude != null && e.longitude != null && e.type !== 'individual')
                .map(e => ({
                    ...e,
                    lat: e.latitude,
                    lng: e.longitude,
                    size: entityPointSize(e.type),
                    color: entityPointColor(e.type),
                })),
        [filteredEntities],
    );

    if (!mounted) return <div className="w-full h-full flex items-center justify-center bg-black"><span className="text-white text-sm">{t('planet.loading')}</span></div>;

    const activeFilterCount = (activeTypes.size < ALL_MARKER_TYPES.length ? 1 : 0)
        + Object.values(activeFilters).reduce((count, filterSet) => count + filterSet.size, 0);

    return (
        <div ref={containerRef} className="absolute inset-0 cursor-move">
            {/* Side filter panel */}
            <FilterPanel
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                activeTypes={activeTypes}
                onTypeToggle={toggleType}
                activeArchetypes={activeArchetypes}
                onArchetypeToggle={toggleArchetype}
                activeRdgs={activeRdgs}
                onRdgToggle={toggleRdg}
                activeFilters={activeFilters}
                filterOptions={filterOptions}
                onFilterToggle={toggleAdvancedFilter}
                onClearAll={clearFilters}
            />

            {useFallback || isLowEndDevice ? (
                <DiscoveryMap entities={filteredEntities} initialZoom={4} />
            ) : (
                <Globe
                    ref={globeRef}
                    width={dims.width}
                    height={dims.height}
                    globeImageUrl="/globe/earth-blue-marble.jpg"
                    bumpImageUrl="/globe/earth-topology.png"
                    backgroundImageUrl="/globe/night-sky.png"
                    atmosphereColor="#3a228a"
                    atmosphereAltitude={0.15}
                    pointsData={pointsData}
                    pointLat="lat"
                    pointLng="lng"
                    pointColor="color"
                    pointAltitude={0.02}
                    pointRadius="size"
                    // pointsMerge intentionally omitted: when true it merges all
                    // points into one geometry which disables per-point colors and
                    // click events — individual (user) dots become invisible.

                    // Individual people: circular profile-photo HTML elements (grouped into clusters)
                    htmlElementsData={clusteredPlanetPoints}
                    htmlLat="lat"
                    htmlLng="lng"
                    htmlAltitude={0.02}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    htmlElement={(d: any) => buildPlanetGlobeHtmlElement(d, {
                        onSelect: handleEntitySelect,
                        onClusterExpand: handleClusterExpand,
                    })}

                    // Interaction
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onPointClick={(point: any) => {
                        handleEntitySelect(point as MapEntity & { lat: number; lng: number });
                    }}
                />
            )}

            {/* Embedded Planet side panels */}
            {activeSidePanel === 'feed' && (
                <PlanetFeedSidebar
                    posts={initialFeedPosts}
                    nextCursor={initialFeedNextCursor}
                    onClose={() => setActiveSidePanel(null)}
                />
            )}
            {activeSidePanel === 'events' && (
                <PlanetEventsSidebar
                    events={initialEvents}
                    onClose={() => setActiveSidePanel(null)}
                />
            )}

            {/* Entity details */}
            {selectedEntity && (
                <EntityDetailsSidebar
                    entity={selectedEntity}
                    onClose={() => setSelectedEntity(null)}
                />
            )}

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h1 className="text-2xl font-bold text-white drop-shadow-md">{t('planet.title')}</h1>
                <p className="text-sm text-gray-200 drop-shadow">{t('planet.activeChangemakers', { count: individualPoints.length })}</p>
                {!useFallback && (
                    <button
                        onClick={() => setUseFallback(true)}
                        className="pointer-events-auto mt-2 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white"
                    >
                        {t('planet.map2dView')}
                    </button>
                )}
            </div>

            {/* Planet toolbar */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
                <button
                    onClick={() => setFilterOpen(prev => !prev)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors pointer-events-auto"
                    aria-label={t('filters.title')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    {t('filters.title')}
                    {activeFilterCount > 0 && (
                        <span className="bg-sky-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedEntity(null);
                        setActiveSidePanel(prev => prev === 'feed' ? null : 'feed');
                    }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors pointer-events-auto"
                    aria-pressed={activeSidePanel === 'feed'}
                >
                    <MessageSquare className="h-4 w-4" />
                    {t('planet.feedToggle')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedEntity(null);
                        setActiveSidePanel(prev => prev === 'events' ? null : 'events');
                    }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors pointer-events-auto"
                    aria-pressed={activeSidePanel === 'events'}
                >
                    <CalendarDays className="h-4 w-4" />
                    {t('planet.eventsToggle')}
                </button>
            </div>

            {/* Reset View Button */}
            {userLocation && !useFallback && (
                <button
                    onClick={() => {
                        globeRef.current?.pointOfView({ lat: userLocation.lat, lng: userLocation.lng, altitude: 2 }, 1500);
                    }}
                    className="absolute bottom-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white rounded-full p-3 shadow-lg transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                </button>
            )}

            {/* Cluster star expansion overlay */}
            {activePlanetCluster && (
                <ClusterStarOverlay
                    x={activePlanetCluster.x}
                    y={activePlanetCluster.y}
                    entities={activePlanetCluster.entities}
                    onSelect={(entity) => {
                        setActivePlanetCluster(null);
                        handleEntitySelect(entity as MapEntity & { lat: number; lng: number });
                    }}
                    onClose={() => setActivePlanetCluster(null)}
                />
            )}
        </div>
    );
}
