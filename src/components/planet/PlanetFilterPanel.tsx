'use client';

import { useTranslation } from 'react-i18next';
import {
    ALL_ARCHETYPES,
    ALL_MARKER_TYPES,
    ALL_RDGS,
    ARCHETYPE_LABELS,
    type FilterOption,
    type MarkerType,
    type PlanetFilterKey,
} from '@/lib/planet-entity-helpers';

interface FilterPanelProps {
    open: boolean;
    onClose: () => void;
    activeTypes: Set<MarkerType>;
    onTypeToggle: (t: MarkerType) => void;
    activeArchetypes: Set<string>;
    onArchetypeToggle: (a: string) => void;
    activeRdgs: Set<string>;
    onRdgToggle: (r: string) => void;
    activeFilters: Record<PlanetFilterKey, Set<string>>;
    filterOptions: Record<PlanetFilterKey, FilterOption[]>;
    onFilterToggle: (key: PlanetFilterKey, value: string) => void;
    onClearAll: () => void;
}

export function FilterPanel({
    open, onClose,
    activeTypes, onTypeToggle,
    activeArchetypes, onArchetypeToggle,
    activeRdgs, onRdgToggle,
    activeFilters,
    filterOptions,
    onFilterToggle,
    onClearAll,
}: Readonly<FilterPanelProps>) {
    const { t } = useTranslation('map');

    const markerTypes: { key: MarkerType; label: string; color: string }[] = [
        { key: 'individual', label: t('layers.individuals'), color: '#38bdf8' },
        { key: 'community', label: t('layers.communities'), color: '#facc15' },
        { key: 'event',     label: t('layers.events'),      color: '#f43f5e' },
        { key: 'issue',     label: t('layers.issues'),      color: '#ef4444' },
        { key: 'signal',    label: t('layers.signals'),     color: '#a855f7' },
    ];

    const hasFilters = activeTypes.size < ALL_MARKER_TYPES.length
        || Object.values(activeFilters).some((filterSet) => filterSet.size > 0);

    const renderChipGroup = (title: string, options: FilterOption[], activeSet: Set<string>, filterKey: PlanetFilterKey, limit?: number) => {
        const visibleOptions = typeof limit === 'number' ? options.slice(0, limit) : options;
        if (visibleOptions.length === 0) return null;
        return (
            <section aria-label={title}>
                <p className="text-white/50 uppercase tracking-widest text-[10px] mb-2">{title}</p>
                <div className="flex flex-wrap gap-1.5">
                    {visibleOptions.map((option) => {
                        const active = activeSet.has(option.value);
                        return (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => onFilterToggle(filterKey, option.value)}
                                className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                                    active
                                        ? 'bg-sky-500 border-sky-400 text-white'
                                        : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </section>
        );
    };

    return (
        <div
            className={`absolute top-0 left-0 h-full z-30 flex transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} pointer-events-auto`}
            style={{ width: 280 }}
        >
            {/* Panel body */}
            <div className="w-full h-full bg-black/80 backdrop-blur-md border-r border-white/10 overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                    <span className="text-white font-semibold text-sm tracking-wide">{t('filters.title')}</span>
                    <div className="flex items-center gap-2">
                        {hasFilters && (
                            <button
                                onClick={onClearAll}
                                className="text-xs text-sky-400 hover:text-sky-200 transition-colors"
                            >
                                {t('filters.clear')}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors p-1 rounded"
                            aria-label={t('planet.closePopup')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 px-4 py-3 space-y-5 text-sm">
                    {/* Marker type */}
                    <section>
                        <p className="text-white/50 uppercase tracking-widest text-[10px] mb-2">{t('planet.filterMarkerType')}</p>
                        <div className="space-y-1.5">
                            {markerTypes.map(({ key, label, color }) => (
                                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                                    <span
                                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-opacity ${activeTypes.has(key) ? 'opacity-100' : 'opacity-30'}`}
                                        style={{ background: color, borderColor: color }}
                                    />
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={activeTypes.has(key)}
                                        onChange={() => onTypeToggle(key)}
                                    />
                                    <span className={`transition-colors ${activeTypes.has(key) ? 'text-white' : 'text-white/40'} group-hover:text-white`}>{label}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Archetypes */}
                    <section>
                        <p className="text-white/50 uppercase tracking-widest text-[10px] mb-2">{t('filters.archetype.title')}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {ALL_ARCHETYPES.map(arch => {
                                const active = activeArchetypes.has(arch);
                                return (
                                    <button
                                        key={arch}
                                        onClick={() => onArchetypeToggle(arch)}
                                        className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                                            active
                                                ? 'bg-sky-500 border-sky-400 text-white'
                                                : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
                                        }`}
                                    >
                                        {ARCHETYPE_LABELS[arch] ?? arch}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* RDGs */}
                    <section>
                        <p className="text-white/50 uppercase tracking-widest text-[10px] mb-2">{t('planet.filterRdg')}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {ALL_RDGS.map(num => {
                                const active = activeRdgs.has(num);
                                return (
                                    <button
                                        key={num}
                                        onClick={() => onRdgToggle(num)}
                                        className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                                            active
                                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                                : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {renderChipGroup(t('filters.communityType.title'), filterOptions.communityTypes, activeFilters.communityTypes, 'communityTypes')}
                    {renderChipGroup(t('filters.changemakeLevel.title'), filterOptions.changemakeLevels, activeFilters.changemakeLevels, 'changemakeLevels')}
                    {renderChipGroup(t('filters.skills.title'), filterOptions.skills, activeFilters.skills, 'skills')}
                    {renderChipGroup(t('filters.offers.title'), filterOptions.offers, activeFilters.offers, 'offers')}
                    {renderChipGroup(t('filters.needs.title'), filterOptions.needs, activeFilters.needs, 'needs')}
                    {renderChipGroup(t('filters.values.title'), filterOptions.values, activeFilters.values, 'values')}
                    {renderChipGroup(t('filters.availability.title'), filterOptions.availability, activeFilters.availability, 'availability', 16)}
                    {renderChipGroup(t('planet.detailsTags'), filterOptions.tags, activeFilters.tags, 'tags', 24)}
                </div>
            </div>
        </div>
    );
}
