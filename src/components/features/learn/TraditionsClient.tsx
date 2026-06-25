'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    SearchIcon,
    GlobeIcon,
    MessageCircleIcon,
    ZapIcon,
    UsersIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowRightIcon,
    BookOpenIcon
} from 'lucide-react';
import { Tradition } from '@/types/learning';

// Category keys — 'all' is sentinel for "show everything", others match item.type
const CATEGORY_KEYS = ['all', 'Dialogue', 'Ritual', 'Energy', 'Mentor'] as const;
type CategoryKey = typeof CATEGORY_KEYS[number];

interface TraditionsClientProps {
    traditions: Tradition[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_ICONS: Record<string, any> = {
    'Dialogue': MessageCircleIcon,
    'Ritual': BookOpenIcon,
    'Energy': ZapIcon,
    'Mentor': UsersIcon,
};

const TYPE_COLORS: Record<string, string> = {
    'Dialogue': 'text-blue-600 bg-blue-50 border-blue-100',
    'Ritual': 'text-purple-600 bg-purple-50 border-purple-100',
    'Energy': 'text-amber-600 bg-amber-50 border-amber-100',
    'Mentor': 'text-emerald-600 bg-emerald-50 border-emerald-100',
};

function TraditionCard({ tradition }: Readonly<{ tradition: Tradition }>) {
    const { t } = useTranslation('common');
    const [expanded, setExpanded] = useState(false);
    const Icon = TYPE_ICONS[tradition.type] || GlobeIcon;
    const colorClass = TYPE_COLORS[tradition.type] || 'text-gray-600 bg-gray-50 border-gray-100';

    return (
        <div
            className={`group bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
                expanded ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-emerald-900/5' : 'border-gray-200'
            }`}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left p-5 flex items-start gap-4 transition-colors hover:bg-gray-50"
                aria-expanded={expanded}
            >
                <div className={`p-2.5 rounded-xl border transition-colors ${expanded ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-400 group-hover:text-emerald-500 group-hover:border-emerald-200'}`}>
                    <Icon size={24} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-none">{tradition.name}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border tracking-wider ${colorClass}`}>
                            {t(`traditions.categories.${tradition.type.toLowerCase()}`, tradition.type)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-3">
                        <GlobeIcon size={12} className="text-emerald-600" />
                        <span>{tradition.region}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed font-normal">
                        {tradition.desc}
                    </p>
                </div>

                <div className="mt-1">
                    {expanded ? (
                        <ChevronUpIcon className="text-emerald-600" size={20} />
                    ) : (
                        <ChevronDownIcon className="text-gray-400 group-hover:text-emerald-600" size={20} />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="px-5 pb-6 pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-gray-100 w-full" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    {t('traditions.prep')}
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {tradition.details.prep}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    {t('traditions.agenda')}
                                </h4>
                                <div className="text-sm text-gray-700 space-y-1.5 p-4 bg-white rounded-xl border border-gray-100 font-medium leading-relaxed shadow-sm">
                                    {tradition.details.agenda}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden group/quote">
                                <MessageCircleIcon size={48} className="absolute -right-2 -bottom-2 text-emerald-200/40 rotate-12 transition-transform group-hover/quote:scale-110" />
                                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                                    <MessageCircleIcon size={14} />
                                    {t('traditions.guideQuestions')}
                                </h4>
                                <p className="text-base text-emerald-900 font-serif italic leading-relaxed relative z-10">
                                    {tradition.details.questions}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                                    <ZapIcon size={14} className="text-amber-500" />
                                    {t('traditions.awarenessShift')}
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
                                    {tradition.details.awareness}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TraditionsClient({ traditions }: Readonly<TraditionsClientProps>) {
    const { t } = useTranslation('common');
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

    const getCategoryLabel = (key: CategoryKey) => {
        return t(`traditions.categories.${key.toLowerCase()}`, key);
    };

    const filtered = useMemo(() => {
        return traditions.filter((item) => {
            const matchesCategory = activeCategory === 'all' || item.type === activeCategory;
            const matchesQuery = !query ||
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.desc.toLowerCase().includes(query.toLowerCase()) ||
                item.region.toLowerCase().includes(query.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [query, activeCategory, traditions]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-200 selection:text-emerald-900 font-sans">
            {/* Background Polish */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#10b98108_0%,_transparent_50%)] pointer-events-none"></div>

            {/* Header / Hero */}
            <div className="relative border-b border-gray-200 bg-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-500/[0.02] -skew-x-12 translate-x-1/2"></div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 relative z-10 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="flex-1">
                            <div className="inline-flex py-1 px-3 mb-6 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-full border border-emerald-200">
                                {t('traditions.badge')}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
                                <span className="text-emerald-600">{t('traditions.title')}</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl font-medium leading-relaxed">
                                {t('traditions.subtitle')}
                            </p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 flex flex-col items-center gap-2 shadow-2xl shadow-emerald-500/5 min-w-[200px]">
                            <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 mb-2">
                                <GlobeIcon size={40} />
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-black text-gray-900 tracking-tight">{traditions.length}</div>
                                <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">{t('traditions.collectedSamples')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-16 flex flex-col md:flex-row gap-4 max-w-5xl">
                        <div className="relative flex-1 group">
                            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={24} />
                            <input
                                type="search"
                                placeholder={t('traditions.searchPlaceholder')}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-6 py-5 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {CATEGORY_KEYS.map(key => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`px-6 py-3.5 rounded-2xl border text-sm font-bold transition-all ${
                                        activeCategory === key
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100'
                                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-gray-900'
                                    }`}
                                >
                                    {getCategoryLabel(key)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{t('traditions.explored')}</h2>
                    <div className="h-px bg-gray-200 flex-1 mx-8 opacity-50"></div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t('traditions.results', { count: filtered.length })}</span>
                </div>

                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filtered.map((tradition, idx) => (
                            <TraditionCard key={`${tradition.name}-${idx}`} tradition={tradition} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="inline-flex p-6 rounded-3xl bg-gray-50 text-gray-300 mb-6 border border-gray-100">
                            <SearchIcon size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('traditions.noResults')}</h3>
                        <p className="text-gray-500 text-lg">{t('traditions.noResultsHint')}</p>
                        <button
                            onClick={() => { setQuery(''); setActiveCategory('all'); }}
                            className="mt-8 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            {t('traditions.showAll')}
                        </button>
                    </div>
                )}
            </main>

            {/* Footer Prompt */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-32">
                <div className="bg-white rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border border-gray-100 shadow-2xl shadow-emerald-500/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_#10b98108_0%,_transparent_60%)]"></div>
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
                            {t('traditions.footerTitle')}
                        </h2>
                        <p className="text-gray-500 text-xl mb-12 leading-relaxed">
                            {t('traditions.footerSubtitle')}
                        </p>
                        <button className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 hover:scale-105 transition-all inline-flex items-center gap-3 group shadow-xl shadow-emerald-100">
                            {t('traditions.submitPractice')}
                            <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
