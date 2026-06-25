'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, Globe, MapPin, Clock, ExternalLink, X, GraduationCap, Leaf, ArrowRight } from 'lucide-react';
import type { LearningProgram } from '@/types/learning';
import { useTranslation } from 'react-i18next';

// --------------------------------------------------------------------------
// Props
// --------------------------------------------------------------------------
interface LearningHubClientProps {
    programs: LearningProgram[];
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCostLabel(cost: number, t: (...args: any[]) => any): string {
    if (cost === 0) return t('learningHub.onlyFree');
    return t('learningHub.priceUsd', { cost });
}

function getCostBadgeClasses(cost: number): string {
    if (cost === 0)
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
    return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
}

function getFormatBadgeClasses(format: string): string {
    return format === 'Online'
        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
        : 'bg-violet-500/15 text-violet-400 border border-violet-500/20';
}

const LEVEL_EMOJI: Record<string, string> = {
    Beginner: '🌱',
    Intermediate: '🌿',
    Advanced: '🌳',
    'Beginner to Intermediate': '🌱→🌿',
    'Beginner to Advanced': '🌱→🌳',
};

// --------------------------------------------------------------------------
// Modal
// --------------------------------------------------------------------------
function ProgramModal({ program, onClose }: Readonly<{ program: LearningProgram; onClose: () => void }>) {
    const { t } = useTranslation('common');
    const levelLabel = t(`learningHub.levels.${program.level}`, program.level);
    return (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <span className="inline-block px-2.5 py-1 mb-2 text-xs font-semibold uppercase tracking-wider rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {program.category}
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 leading-snug">{program.title}</h2>
                    </div>

                    <p className="text-gray-600 text-base mb-8 leading-relaxed">{program.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                        {[
                            { label: t('learningHub.labelCategory'), value: program.rdg },
                            { label: t('learningHub.labelLevel'), value: `${LEVEL_EMOJI[program.level] ?? ''} ${levelLabel}` },
                            { label: t('learningHub.labelCost'), value: getCostLabel(program.cost, t) },
                            { label: t('learningHub.labelDuration'), value: program.duration },
                            { label: t('learningHub.labelFormatLocation'), value: `${program.format} — ${program.locationDetails}` },
                            { label: t('learningHub.labelLanguage'), value: program.language },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                <p className="text-sm font-semibold text-gray-700">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Entry */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-900 mb-2">{t('learningHub.entryConditions')}</h4>
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4">
                            <p className="text-sm text-gray-700">{program.entryCriteria}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">{t('learningHub.noDegreeNote')}</p>
                    </div>

                    {/* CTA */}
                    <a
                        href={program.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-200"
                    >
                        <ExternalLink size={18} />
                        {t('learningHub.visitProgram')} →
                    </a>
                </div>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// Card
// --------------------------------------------------------------------------
function ProgramCard({ program, onClick }: Readonly<{ program: LearningProgram; onClick: () => void }>) {
    const { t } = useTranslation('common');
    return (
        <button type="button" className="group flex flex-col w-full text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer" onClick={onClick}>
            {/* Card body */}
            <div className="flex flex-col gap-3 p-6 flex-1">
                {/* Badges row */}
                <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getCostBadgeClasses(program.cost)
                        .replace('bg-emerald-500/15 text-emerald-400 border-emerald-500/20', 'bg-emerald-100 text-emerald-800 border-emerald-200')
                        .replace('bg-amber-500/15 text-amber-400 border-amber-500/20', 'bg-amber-100 text-amber-800 border-amber-200')}`}>
                        {getCostLabel(program.cost, t)}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getFormatBadgeClasses(program.format)
                        .replace('bg-blue-500/15 text-blue-400 border-blue-500/20', 'bg-blue-100 text-blue-800 border-blue-200')
                        .replace('bg-violet-500/15 text-violet-400 border-violet-500/20', 'bg-violet-100 text-violet-800 border-violet-200')}`}>
                        {program.format}
                    </span>
                </div>

                {/* RDG category */}
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider leading-none">{program.category}</p>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">{program.title}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{program.description}</p>

                {/* Meta */}
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-gray-50 text-xs text-gray-500">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-emerald-500 shrink-0" />{program.locationDetails}</span>
                    <span className="flex items-center gap-2"><Clock size={14} className="text-emerald-500 shrink-0" />{program.duration}</span>
                    <span className="flex items-center gap-2"><Globe size={14} className="text-emerald-500 shrink-0" />{program.language}</span>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 bg-gray-50/50 group-hover:bg-emerald-50 transition-colors">
                <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 transition-colors">
                    {t('learningHub.viewDetails')} <ArrowRight size={14} />
                </span>
            </div>
        </button>
    );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------
export default function LearningHubClient({ programs }: Readonly<LearningHubClientProps>) {
    const { t } = useTranslation('common');
    const [search, setSearch] = useState('');
    const [filterFormat, setFilterFormat] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterMaxCost, setFilterMaxCost] = useState<number>(200);
    const [filterLanguage, setFilterLanguage] = useState<string>('all');
    const [selectedProgram, setSelectedProgram] = useState<LearningProgram | null>(null);

    // Derived option lists
    const categories = useMemo(
        () => Array.from(new Set(programs.map((p) => p.category))).sort((a, b) => a.localeCompare(b)),
        [programs]
    );
    const languages = useMemo(
        () =>
            Array.from(
                new Set(
                    programs.flatMap((p) =>
                        p.language.split(/[,/]/).map((l) => l.trim()).filter(Boolean)
                    )
                )
            ).sort((a, b) => a.localeCompare(b)),
        [programs]
    );

    // Filter logic
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return programs.filter((p) => {
            if (filterFormat !== 'all' && p.format !== filterFormat) return false;
            if (filterCategory !== 'all' && p.category !== filterCategory) return false;
            if (p.cost > filterMaxCost) return false;
            if (filterLanguage !== 'all' && !p.language.includes(filterLanguage)) return false;
            if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.locationDetails.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [programs, search, filterFormat, filterCategory, filterMaxCost, filterLanguage]);

    const resetFilters = useCallback(() => {
        setSearch('');
        setFilterFormat('all');
        setFilterCategory('all');
        setFilterMaxCost(200);
        setFilterLanguage('all');
    }, []);

    const hasActiveFilters = filterFormat !== 'all' || filterCategory !== 'all' || filterMaxCost < 200 || filterLanguage !== 'all' || search !== '';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                        <div className="inline-flex p-4 bg-emerald-100 rounded-2xl shrink-0">
                            <GraduationCap className="text-emerald-600" size={48} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">{t('learningHub.title')}</h1>
                            <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                                {t('learningHub.subtitle', { count: programs.length })}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: t('learningHub.stats.total'), value: programs.length },
                            { label: t('learningHub.stats.free'), value: programs.filter((p) => p.cost === 0).length },
                            { label: t('learningHub.stats.online'), value: programs.filter((p) => p.format === 'Online').length },
                            { label: t('learningHub.stats.categories'), value: categories.length },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <p className="text-3xl font-extrabold text-emerald-600 mb-1">{value}</p>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[280px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('learningHub.searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                            />
                        </div>

                        {/* Dropdowns Group */}
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={filterFormat}
                                onChange={(e) => setFilterFormat(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">{t('learningHub.format')}</option>
                                <option value="Online">Online</option>
                                <option value="Hybrid">{t('learningHub.hybrid')}</option>
                            </select>

                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer max-w-[200px]"
                            >
                                <option value="all">{t('learningHub.category')}</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <select
                                value={filterMaxCost}
                                onChange={(e) => setFilterMaxCost(Number(e.target.value))}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value={200}>{t('learningHub.priceAll')}</option>
                                <option value={100}>{t('learningHub.maxPrice100')}</option>
                                <option value={50}>{t('learningHub.maxPrice50')}</option>
                                <option value={0}>{t('learningHub.onlyFree')}</option>
                            </select>

                            <select
                                value={filterLanguage}
                                onChange={(e) => setFilterLanguage(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">{t('language.label')}</option>
                                {languages.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reset */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="px-4 py-3 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
                            >
                                <X size={16} /> {t('learningHub.clearFilters')}
                            </button>
                        )}
                    </div>

                    {/* Result count */}
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Filter size={14} />
                        <span>{t('learningHub.results', { count: filtered.length, total: programs.length })}</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Leaf className="text-gray-300" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('learningHub.noResults')}</h3>
                        <p className="text-gray-500 text-lg mb-8">{t('learningHub.noResultsHint')}</p>
                        <button
                            onClick={resetFilters}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-100"
                        >
                            {t('learningHub.clearAllFilters')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((program) => (
                            <ProgramCard
                                key={program.id}
                                program={program}
                                onClick={() => setSelectedProgram(program)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            {selectedProgram && (
                <ProgramModal
                    program={selectedProgram}
                    onClose={() => setSelectedProgram(null)}
                />
            )}
        </div>
    );
}
