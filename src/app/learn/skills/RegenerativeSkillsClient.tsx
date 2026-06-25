'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlattenedSkill, SkillQuadrant, SkillHorizon, SkillLevel } from './types';
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { LayoutGridIcon, SearchIcon, FilterIcon, XIcon, SproutIcon, BuildingIcon, SparklesIcon, UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Slug maps for quadrant/horizon/level (keys match DB values, values are i18n slugs) ---

const QUADRANT_KEY: Record<SkillQuadrant, string> = {
    'UL - Intentional': 'UL',
    'UR - Behavioral': 'UR',
    'LL - Cultural': 'LL',
    'LR - Social/Systems': 'LR',
};

const HORIZON_KEY: Record<SkillHorizon, string> = {
    'H1_Hospicing': 'H1',
    'H2_Bridging': 'H2',
    'H3_Radical': 'H3',
};

// --- Static (non-translated) visual config ---

const QUADRANT_COLORS: Record<SkillQuadrant, { icon: React.ReactNode; color: string; bg: string }> = {
    'UL - Intentional': { icon: <SparklesIcon className="w-4 h-4" />, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'UR - Behavioral':  { icon: <SproutIcon className="w-4 h-4" />,   color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'LL - Cultural':    { icon: <UsersIcon className="w-4 h-4" />,     color: 'text-teal-600',   bg: 'bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400' },
    'LR - Social/Systems': { icon: <BuildingIcon className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
};

const HORIZON_DOT: Record<SkillHorizon, string> = {
    'H1_Hospicing': 'bg-rose-500',
    'H2_Bridging':  'bg-amber-500',
    'H3_Radical':   'bg-emerald-500',
};

export default function RegenerativeSkillsClient({
    initialSkills,
    error,
}: Readonly<{
    initialSkills: FlattenedSkill[];
    error?: boolean;
}>) {
    const { t } = useTranslation('learning');
    const [search, setSearch] = useState('');

    // Multi-select filters
    const [selectedQuadrants, setSelectedQuadrants] = useState<Set<SkillQuadrant>>(new Set());
    const [selectedHorizons, setSelectedHorizons] = useState<Set<SkillHorizon>>(new Set());
    const [selectedLevels, setSelectedLevels] = useState<Set<SkillLevel>>(new Set());

    // Filter Logic (must be before any early returns — React rules of hooks)
    const filteredSkills = useMemo(() => {
        let result = initialSkills;

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(s => s.text.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q));
        }
        if (selectedQuadrants.size > 0) {
            result = result.filter(s => selectedQuadrants.has(s.quadrant));
        }
        if (selectedHorizons.size > 0) {
            result = result.filter(s => selectedHorizons.has(s.horizon));
        }
        if (selectedLevels.size > 0) {
            result = result.filter(s => selectedLevels.has(s.level));
        }

        return result;
    }, [initialSkills, search, selectedQuadrants, selectedHorizons, selectedLevels]);

    // Error state (after all hooks — React rules of hooks)
    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 p-6 rounded-lg flex items-center gap-3 border border-red-100 dark:border-red-900">
                    <LayoutGridIcon className="w-6 h-6 shrink-0 text-red-500" />
                    <div>
                        <h2 className="font-semibold text-lg">{t('skills.dbError')}</h2>
                        <p>{t('skills.dbErrorDetail')}</p>
                    </div>
                </div>
            </div>
        );
    }

    const toggleSet = <T,>(set: Set<T>, value: T, setter: React.Dispatch<React.SetStateAction<Set<T>>>) => {
        const newSet = new Set(set);
        if (newSet.has(value)) newSet.delete(value);
        else newSet.add(value);
        setter(newSet);
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedQuadrants(new Set());
        setSelectedHorizons(new Set());
        setSelectedLevels(new Set());
    };

    const hasActiveFilters = search !== '' || selectedQuadrants.size > 0 || selectedHorizons.size > 0 || selectedLevels.size > 0;

    const horizonKeys = Object.keys(HORIZON_KEY) as SkillHorizon[];
    const quadrantKeys = Object.keys(QUADRANT_KEY) as SkillQuadrant[];
    const levelKeys: SkillLevel[] = ['Micro', 'Meso', 'Macro'];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <LayoutGridIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                {t('skills.title')}
                            </h1>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                            {t('skills.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="space-y-8">
                        {/* Search Bar */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t('skills.searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pb-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12 shadow-sm"
                            />
                        </div>

                        {/* Filters Config */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <FilterIcon className="w-4 h-4 text-gray-500" />
                                    {t('skills.filters')}
                                </h3>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="text-xs text-rose-500 hover:underline">
                                        {t('skills.clearFilters')}
                                    </button>
                                )}
                            </div>

                            {/* Horizons */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b">
                                    {t('skills.horizons')}
                                </h4>
                                <div className="space-y-2">
                                    {horizonKeys.map(h => (
                                        <button
                                            key={h}
                                            onClick={() => toggleSet(selectedHorizons, h, setSelectedHorizons)}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors border ${selectedHorizons.has(h) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'}`}
                                        >
                                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <span className={`w-2 h-2 rounded-full ${HORIZON_DOT[h]}`} />
                                                {t(`skills.horizonLabels.${HORIZON_KEY[h]}`).split(':')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quadrants */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b">
                                    {t('skills.quadrants')}
                                </h4>
                                <div className="space-y-2">
                                    {quadrantKeys.map(q => (
                                        <button
                                            key={q}
                                            onClick={() => toggleSet(selectedQuadrants, q, setSelectedQuadrants)}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors border ${selectedQuadrants.has(q) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'}`}
                                        >
                                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <span className={QUADRANT_COLORS[q].color}>{QUADRANT_COLORS[q].icon}</span>
                                                {t(`skills.quadrantLabels.${QUADRANT_KEY[q]}`)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Level */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b">
                                    {t('skills.level')}
                                </h4>
                                <div className="space-y-2">
                                    {levelKeys.map(l => (
                                        <button
                                            key={l}
                                            onClick={() => toggleSet(selectedLevels, l, setSelectedLevels)}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors border ${selectedLevels.has(l) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'}`}
                                        >
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {t(`skills.levelLabels.${l}`)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {t('skills.resultsCount', { count: filteredSkills.length })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {filteredSkills.map(skill => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        key={skill.id}
                                    >
                                        <Card className="h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                                            {/* Edge Horizon Indicator */}
                                            <div className={`absolute inset-x-0 top-0 h-1 ${HORIZON_DOT[skill.horizon]}`} />

                                            <CardContent className="p-5 pt-7 flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4 gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${QUADRANT_COLORS[skill.quadrant].bg}`}>
                                                        {QUADRANT_COLORS[skill.quadrant].icon}
                                                        {t(`skills.quadrantLabels.${QUADRANT_KEY[skill.quadrant]}`)}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-gray-500 shadow-sm bg-white dark:bg-gray-900">
                                                        {t(`skills.levelLabels.${skill.level}`)}
                                                    </Badge>
                                                </div>

                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                                                    {skill.domain}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-grow">
                                                    {skill.text}
                                                </p>

                                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <div className={`w-2 h-2 rounded-full shadow-sm ${HORIZON_DOT[skill.horizon]}`} />
                                                        {t(`skills.horizonLabels.${HORIZON_KEY[skill.horizon]}`).split(':')[0]}
                                                    </span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-400">#{skill.id}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredSkills.length === 0 && (
                                <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <XIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="font-medium text-lg">{t('skills.noResults')}</p>
                                    <p className="text-sm mt-1">{t('skills.noResultsHint')}</p>
                                    <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors">
                                        {t('skills.clearFiltersBtn')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
