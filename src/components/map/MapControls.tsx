'use client';

import { useTranslation } from 'react-i18next';
import {
  LayersIcon,
  FilterIcon,
  LocateIcon,
  ZoomInIcon,
  ZoomOutIcon,
  Search,
  List,
  Map as MapIconLucide,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Z_CLASS } from '@/lib/z-index';

// Map controls component
export function MapControls({
    onZoomIn,
    onZoomOut,
    onLocate,
    onToggleLayers,
    onToggleFilters,
    showLayersPanel,
    showFiltersPanel,
    searchQuery,
    onSearch,
    viewMode,
    onToggleView
}: Readonly<{
    onZoomIn: () => void;
    onZoomOut: () => void;
    onLocate: () => void;
    onToggleLayers: () => void;
    onToggleFilters: () => void;
    showLayersPanel: boolean;
    showFiltersPanel: boolean;
    searchQuery: string;
    onSearch: (query: string) => void;
    viewMode: 'map' | 'list';
    onToggleView: (mode: 'map' | 'list') => void;
}>) {
    const { t } = useTranslation('map');

    return (
        <>
            {/* Top Left: Search & View Toggle */}
            <div className={`absolute left-4 top-4 ${Z_CLASS.mapOverlay} flex flex-col gap-2 w-full max-w-sm pointer-events-none`}>
                <div className="flex gap-2 pointer-events-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder={t('controls.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                            className="pl-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-lg border-emerald-100/50 focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-md shadow-lg border border-emerald-100/50 p-1">
                        <Button
                            variant={viewMode === 'map' ? 'primary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8"
                            onClick={() => onToggleView('map')}
                            title={t('controls.mapView')}
                        >
                            <MapIconLucide className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'primary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8"
                            onClick={() => onToggleView('list')}
                            title={t('controls.listView')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top Right: Map Controls */}
            <div className={`absolute right-4 top-4 ${Z_CLASS.mapOverlay} flex flex-col gap-2`}>
                <Button
                    variant={showLayersPanel ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={onToggleLayers}
                    className="shadow-lg h-10 w-10 md:h-9 md:w-auto"
                    title={t('layers.title')}
                >
                    <LayersIcon className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
                <Button
                    variant={showFiltersPanel ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={onToggleFilters}
                    className="shadow-lg h-10 w-10 md:h-9 md:w-auto"
                    title={t('filters.title')}
                >
                    <FilterIcon className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
                <div className="h-px bg-gray-300 dark:bg-gray-600 my-1 hidden md:block" />
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onZoomIn}
                    className="shadow-lg h-10 w-10 md:h-9 md:w-auto hidden md:flex"
                    title={t('controls.zoomIn')}
                >
                    <ZoomInIcon className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onZoomOut}
                    className="shadow-lg h-10 w-10 md:h-9 md:w-auto hidden md:flex"
                    title={t('controls.zoomOut')}
                >
                    <ZoomOutIcon className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onLocate}
                    className="shadow-lg h-10 w-10 md:h-9 md:w-auto"
                    title={t('controls.myLocation')}
                >
                    <LocateIcon className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
            </div>
        </>
    );
}
