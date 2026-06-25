'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BarChart2, Wrench, ArrowRight } from 'lucide-react';
import type { ToolCard } from '@/types/tools';

export default function ToolsHubClient() {
    const { t } = useTranslation('common');

const TOOLS: ToolCard[] = [
    {
      id: 'impact-dashboard',
      title: t('tools.impactDashboard.title'),
      description: t('tools.impactDashboard.description'),
      icon: '⚙️',
      href: '/tools/impact-dashboard',
      badge: t('tools.impactDashboard.badge'),
      color: 'from-violet-500/20 via-purple-500/10 to-transparent',
    },
    {
      id: 'pre-meeting-audit',
      title: t('tools.preMeetingAudit.title'),
      description: t('tools.preMeetingAudit.description'),
      icon: '📋',
      href: '/tools/pre-meeting-audit',
      badge: t('tools.preMeetingAudit.badge'),
      color: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    },
    {
      id: 'participation-index',
      title: t('tools.participationIndex.title'),
      description: t('tools.participationIndex.description'),
      icon: '⚖️',
      href: '/tools/participation-index',
      badge: t('tools.participationIndex.badge'),
      color: 'from-amber-500/20 via-orange-500/10 to-transparent',
    },
    {
      id: 'open-platform',
      title: t('tools.openPlatform.title'),
      description: t('tools.openPlatform.description'),
      icon: '🧭',
      href: '/tools/open-platform',
      badge: t('tools.openPlatform.badge'),
      color: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
    },
    {
      id: 'draw',
      title: t('tools.draw.title'),
      description: t('tools.draw.description'),
      icon: '✏️',
      href: '/draw',
      badge: t('tools.draw.badge'),
      color: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
    },
    {
      id: 'partimap',
      title: t('tools.partimap.title'),
      description: t('tools.partimap.description'),
      icon: '🗺️',
      href: 'https://www.partimap.eu/',
      badge: t('tools.partimap.badge'),
      color: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    },
    {
      id: 'polis',
      title: t('tools.polis.title'),
      description: t('tools.polis.description'),
      icon: '💬',
      href: 'https://pol.is/',
      badge: t('tools.polis.badge'),
      color: 'from-cyan-500/20 via-sky-500/10 to-transparent',
    },
    {
      id: 'geo-libre',
      title: t('tools.geoLibre.title'),
      description: t('tools.geoLibre.description'),
      icon: '🌍',
      href: 'https://github.com/opengeos/GeoLibre',
      badge: t('tools.geoLibre.badge'),
      color: 'from-green-500/20 via-emerald-500/10 to-transparent',
    },
  ];

    const COMING_SOON: ToolCard[] = [
        {
            id: 'archetype-gap',
            title: t('tools.archetypeGap.title'),
            description: t('tools.archetypeGap.description'),
            icon: '🧩',
            href: '#',
            color: 'from-sky-500/20 via-blue-500/10 to-transparent',
        },
        {
            id: 'network-health',
            title: t('tools.networkHealth.title'),
            description: t('tools.networkHealth.description'),
            icon: '🕸️',
            href: '#',
            color: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        },
    ];

    return (
        <div data-testid="tools-hub-root" className="min-h-screen bg-slate-50 text-slate-950 dark:bg-gray-950 dark:text-gray-100">
            {/* Hero */}
            <div className="bg-gradient-to-br from-violet-950 via-gray-900 to-gray-950 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-start gap-5">
                        <div className="p-3 bg-violet-500/20 border border-violet-500/30 rounded-2xl shrink-0">
                            <BarChart2 className="text-violet-400" size={36} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 break-words">🔬 {t('tools.hero.title')}</h1>
                            <p data-testid="tools-hero-subtitle" className="text-lg text-slate-300 dark:text-slate-300 max-w-2xl">
                                {t('tools.hero.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Available tools */}
                <section className="mb-12">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Wrench size={14} /> {t('tools.available')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {TOOLS.map((tool) => (
                            <Link
                                key={tool.id}
                                href={tool.href}
                                {...(tool.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className={`group relative flex flex-col bg-gradient-to-br ${tool.color} bg-slate-900 dark:bg-slate-900/80 border border-white/15 rounded-2xl p-6 shadow-sm hover:border-violet-300/60 hover:shadow-lg hover:shadow-violet-900/20 transition-all duration-300`}
                            >
                                {tool.badge && (
                                    <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-100 dark:text-violet-100 border border-violet-300/40 font-medium">
                                        {tool.badge}
                                    </span>
                                )}
                                <span className="text-3xl mb-4">{tool.icon}</span>
                                <h3 className="text-lg font-bold text-white dark:text-white mb-2 group-hover:text-violet-200 transition-colors pr-20 leading-snug">
                                    {tool.title}
                                </h3>
                                <p data-testid="tool-card-description" className="text-sm text-slate-200 dark:text-slate-200 leading-relaxed flex-1">{tool.description}</p>
                                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-violet-200 dark:text-violet-200 group-hover:text-white transition-colors">
                                    {t('tools.openTool')} <ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Coming soon */}
                <section>
                    <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-5">
                        {t('tools.comingSoon')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {COMING_SOON.map((tool) => (
                            <div
                                key={tool.id}
                                className="flex flex-col bg-white/80 dark:bg-gray-900/30 border border-slate-200 dark:border-white/5 rounded-2xl p-6 opacity-60 select-none"
                            >
                                <span className="text-3xl mb-4 grayscale">{tool.icon}</span>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-gray-500 mb-2 leading-snug">{tool.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-gray-500 leading-relaxed flex-1">{tool.description}</p>
                                <div className="mt-5 text-xs text-slate-600 dark:text-gray-500 font-semibold tracking-wider uppercase">
                                    {t('tools.comingSoonLabel')}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
