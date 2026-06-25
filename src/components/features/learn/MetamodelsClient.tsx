'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
    Search, Filter, X, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { type Metamodel, getCategoryColors, CATEGORY_SLUG, getLocalizedModel } from './metamodels.config';
import { MetamodelCard } from './MetamodelCard';
import { MetamodelDetail } from './MetamodelDetail';

export type { Metamodel } from './metamodels.config';

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------
interface MetamodelsClientProps {
    models: Metamodel[];
}

interface MetamodelSectionProps {
    cat: string;
    items: Metamodel[];
    language: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: TFunction<any, any>;
    onSelect: (model: Metamodel) => void;
}

function MetamodelSection({ cat, items, language, t, onSelect }: Readonly<MetamodelSectionProps>) {
    const colors = getCategoryColors(cat);
    const label = t(`metamodels.categories.${CATEGORY_SLUG[cat] ?? 'cosmic'}`, cat);
    return (
        <section key={cat}>
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                <h2 className={`text-lg font-extrabold uppercase tracking-widest ${colors.text}`}>
                    {label}
                </h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                    {items.length}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((model) => (
                    <MetamodelCard
                        key={model.id}
                        model={getLocalizedModel(model, language)}
                        onClick={() => onSelect(model)}
                    />
                ))}
            </div>
        </section>
    );
}

export default function MetamodelsClient({ models }: Readonly<MetamodelsClientProps>) {
    const { t } = useTranslation('common');
    const { language } = useLanguage();
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterScale, setFilterScale] = useState('all');
    const [filterTradition, setFilterTradition] = useState('all');
    const [filterDomain, setFilterDomain] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');
    const [selectedModel, setSelectedModel] = useState<Metamodel | null>(null);
    const [groupByCategory, setGroupByCategory] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Derived option lists
    const categories = useMemo(
        () => Array.from(new Set(models.map((m) => m.category))),
        [models]
    );
    const scales = useMemo(
        () => Array.from(new Set(models.flatMap((m) => m.nativeScale))).sort((a, b) => a.localeCompare(b)),
        [models]
    );
    const traditions = useMemo(
        () => Array.from(new Set(models.map((m) => m.originTradition))).sort((a, b) => a.localeCompare(b)),
        [models]
    );
    const domains = useMemo(
        () => Array.from(new Set(models.flatMap((m) => m.domains))).sort((a, b) => a.localeCompare(b)),
        [models]
    );
    const regions = useMemo(
        () => Array.from(new Set(models.map((m) => m.region))).sort((a, b) => a.localeCompare(b)),
        [models]
    );

    // Filter logic
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return models.filter((m) => {
            if (filterCategory !== 'all' && m.category !== filterCategory) return false;
            if (filterScale !== 'all' && !m.nativeScale.includes(filterScale)) return false;
            if (filterTradition !== 'all' && m.originTradition !== filterTradition) return false;
            if (filterDomain !== 'all' && !m.domains.includes(filterDomain)) return false;
            if (filterRegion !== 'all' && m.region !== filterRegion) return false;
            if (q) {
                const searchable = [
                    m.name, m.coreMechanism, m.applicability, m.changemakerUse,
                    m.author, m.region, m.originTradition, m.keyQuote,
                    ...m.tags, ...m.domains, ...m.nativeScale, ...m.applicableFor
                ].join(' ').toLowerCase();
                if (!searchable.includes(q)) return false;
            }
            return true;
        });
    }, [models, search, filterCategory, filterScale, filterTradition, filterDomain, filterRegion]);

    const resetFilters = useCallback(() => {
        setSearch('');
        setFilterCategory('all');
        setFilterScale('all');
        setFilterTradition('all');
        setFilterDomain('all');
        setFilterRegion('all');
    }, []);

    const hasActiveFilters = filterCategory !== 'all' || filterScale !== 'all' ||
        filterTradition !== 'all' || filterDomain !== 'all' || filterRegion !== 'all' || search !== '';

    const activeFilterCount = [filterCategory, filterScale, filterTradition, filterDomain, filterRegion]
        .filter(f => f !== 'all').length + (search ? 1 : 0);

    // Group by category if toggled
    const groupedFiltered = useMemo(() => {
        if (!groupByCategory) return null;
        const groups: Record<string, Metamodel[]> = {};
        categories.forEach((cat) => {
            const items = filtered.filter((m) => m.category === cat);
            if (items.length > 0) groups[cat] = items;
        });
        return groups;
    }, [filtered, groupByCategory, categories]);

    const selectDropdownClass = "bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer";

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <div className="flex flex-col md:flex-row md:items-start gap-8 mb-12">
                        <div className="inline-flex p-4 bg-violet-100 rounded-2xl shrink-0">
                            <Layers className="text-violet-600" size={48} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">{t('metamodels.badge')}</p>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                                {t('metamodels.title')}
                            </h1>
                            <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
                                {t('metamodels.subtitle', { count: models.length })}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {categories.map((cat) => {
                            const colors = getCategoryColors(cat);
                            const count = models.filter((m) => m.category === cat).length;
                            const label = t(`metamodels.categories.${CATEGORY_SLUG[cat] ?? 'cosmic'}`, cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                                    className={`rounded-2xl p-4 border text-left transition-all hover:shadow-md ${filterCategory === cat
                                        ? `${colors.bg} ${colors.border} shadow-md ring-2 ring-offset-1 ring-current`
                                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${colors.dot} mb-2`} />
                                    <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{count}</p>
                                    <p className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${filterCategory === cat ? colors.text : 'text-gray-500'}`}>
                                        {label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filters bar */}
            <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('metamodels.searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                            />
                        </div>

                        {/* Toggle advanced filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300'}`}
                        >
                            <Filter size={14} />
                            {t('metamodels.filters')}
                            {activeFilterCount > 0 && (
                                <span className="bg-white text-emerald-700 text-xs font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                                    {activeFilterCount}
                                </span>
                            )}
                            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Group toggle */}
                        <button
                            onClick={() => setGroupByCategory(!groupByCategory)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all ${groupByCategory ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-violet-300'}`}
                        >
                            <Layers size={14} />
                            {t('metamodels.groupByScale')}
                        </button>

                        {/* Reset */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                            >
                                <X size={14} /> {t('metamodels.clearAll')}
                            </button>
                        )}
                    </div>

                    {/* Advanced filters panel */}
                    {showFilters && (
                        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectDropdownClass}>
                                <option value="all">{t('metamodels.allScales')}</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{t(`metamodels.categories.${CATEGORY_SLUG[c] ?? 'cosmic'}`, c)}</option>
                                ))}
                            </select>

                            <select value={filterScale} onChange={(e) => setFilterScale(e.target.value)} className={selectDropdownClass}>
                                <option value="all">{t('metamodels.nativeScale')}</option>
                                {scales.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            <select value={filterTradition} onChange={(e) => setFilterTradition(e.target.value)} className={selectDropdownClass}>
                                <option value="all">{t('metamodels.traditionOrigin')}</option>
                                {traditions.map((tr) => (
                                    <option key={tr} value={tr}>{tr}</option>
                                ))}
                            </select>

                            <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} className={selectDropdownClass}>
                                <option value="all">{t('metamodels.domain')}</option>
                                {domains.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className={selectDropdownClass}>
                                <option value="all">{t('metamodels.region')}</option>
                                {regions.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Result count */}
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Filter size={12} />
                        <span>{t('metamodels.showing', { count: filtered.length, total: models.length })}</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {(() => {
                if (filtered.length === 0) return (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Layers className="text-gray-300" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('metamodels.noResults')}</h3>
                        <p className="text-gray-500 text-lg mb-8">{t('metamodels.noResultsHint')}</p>
                        <button
                            onClick={resetFilters}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-100"
                        >
                            {t('metamodels.clearAllFilters')}
                        </button>
                    </div>
                );
                if (groupedFiltered) return (
                    // Grouped view
                    <div className="flex flex-col gap-12">
                        {Object.entries(groupedFiltered).map(([cat, items]) => (
                            <MetamodelSection
                                key={cat}
                                cat={cat}
                                items={items}
                                language={language}
                                t={t}
                                onSelect={setSelectedModel}
                            />
                        ))}
                    </div>
                );
                return (
                    // Flat grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((model) => (
                            <MetamodelCard
                                key={model.id}
                                model={getLocalizedModel(model, language)}
                                onClick={() => setSelectedModel(model)}
                            />
                        ))}
                    </div>
                );
                })()}

                {/* Intro note */}
                <div className="mt-16 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 leading-relaxed max-w-4xl mx-auto">
                    <strong className="font-bold">{t('metamodels.representationNote')}</strong>
                </div>
            </main>

            {/* Detail modal */}
            {selectedModel && (
                <MetamodelDetail
                    model={getLocalizedModel(selectedModel, language)}
                    onClose={() => setSelectedModel(null)}
                />
            )}
        </div>
    );
}
