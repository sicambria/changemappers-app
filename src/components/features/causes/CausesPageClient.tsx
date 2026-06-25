'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
    HeartHandshake, Brain, Leaf, TrendingUp, Scale, Anchor,
    Users, ChevronRight, Compass
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// --- Types ---

export interface CauseListItem {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    websites: string | null;
    mainCauseCount: number;
    interestedCount: number;
}

export interface GroupedDomain {
    num: number;
    subtitle: string;       // e.g. 'RDG 1–6' (static, not translated)
    color: string;          // Tailwind gradient classes
    bg: string;
    border: string;
    badge: string;
    iconColor: string;
    causes: CauseListItem[];
    subCauses: CauseListItem[];
}

interface CausesPageClientProps {
    grouped: GroupedDomain[];
    topicCauses: CauseListItem[];
    uncategorized: CauseListItem[];
    totalMembers: number;
    causesCount: number;
    error?: boolean;
}

// --- Icon map (React components can only be instantiated in client components) ---

const DOMAIN_ICONS: Record<number, React.ElementType> = {
    1: Brain,
    2: Leaf,
    3: TrendingUp,
    4: Scale,
    5: Anchor,
};

function getRdgNum(websites: string | null): number {
    if (!websites) return 0;
    const match = /rdg:(\d+)/.exec(websites);
    return match ? Number.parseInt(match[1]) : 0;
}

function getDomainNum(websites: string | null): number {
    if (!websites) return 0;
    const match = /domain:(\d+)/.exec(websites);
    return match ? Number.parseInt(match[1]) : 0;
}

function getTopicIcon(websites: string | null): string {
    const match = websites?.match(/icon:([^|]+)/);
    return match?.[1] ?? '🌿';
}

function getXRdgNums(websites: string | null): number[] {
    if (!websites) return [];
    const match = /xrdg:([\d,]+)/.exec(websites);
    if (!match) return [];
    return match[1].split(',').map(n => Number.parseInt(n, 10)).filter(n => !Number.isNaN(n));
}

// RDG 1–6 → domain 1, 7–12 → 2, 13–18 → 3, 19–24 → 4, 25–30 → 5
function rdgToDomain(rdgNum: number): number {
    if (rdgNum <= 6) return 1;
    if (rdgNum <= 12) return 2;
    if (rdgNum <= 18) return 3;
    if (rdgNum <= 24) return 4;
    return 5;
}

function ExtraRdgBadges({ xrdgs, grouped }: Readonly<{ xrdgs: number[]; grouped: GroupedDomain[] }>) {
    return (
        <>
            {xrdgs.map(xrdg => {
                const xDomain = grouped.find(d => d.num === rdgToDomain(xrdg));
                return (
                    <span
                        key={xrdg}
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${xDomain ? xDomain.badge : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                        RDG {xrdg}
                    </span>
                );
            })}
        </>
    );
}

export default function CausesPageClient({
    grouped,
    topicCauses,
    uncategorized,
    totalMembers,
    causesCount,
    error,
}: Readonly<CausesPageClientProps>) {
    const { t } = useTranslation('common');

    if (error) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <HeartHandshake className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h1 className="text-3xl font-bold mb-4">{t('causes.pageTitle')}</h1>
                <p className="text-muted-foreground">{t('causes.loadError')}</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-20 dark:from-gray-900 dark:via-emerald-950 dark:to-gray-900">
                <div
                    className="absolute inset-0 opacity-60 dark:opacity-30"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 18% 78%, rgba(5, 150, 105, 0.18) 0%, transparent 48%), radial-gradient(circle at 82% 18%, rgba(8, 145, 178, 0.2) 0%, transparent 46%)',
                    }}
                />
                <div className="relative container mx-auto max-w-4xl text-center">
                    <HeartHandshake className="mx-auto mb-6 h-16 w-16 text-emerald-600 drop-shadow-sm dark:text-emerald-300" />
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
                        {t('causes.pageTitle')}
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                        {t('causes.pageSubtitle')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-medium text-gray-600 dark:text-gray-300 sm:gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{causesCount}</span>
                            <span>{t('causes.statCauses')}</span>
                        </div>
                        <div className="hidden h-8 w-px bg-emerald-200 dark:bg-emerald-800 sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">5</span>
                            <span>{t('causes.statDomains')}</span>
                        </div>
                        <div className="hidden h-8 w-px bg-emerald-200 dark:bg-emerald-800 sm:block" />
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                            <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{totalMembers}</span>
                            <span>{t('causes.statMembers')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl py-12 space-y-16">
                {/* Domain groups */}
                {grouped.map(domain => {
                    const DomainIcon = DOMAIN_ICONS[domain.num] ?? HeartHandshake;
                    return domain.causes.length > 0 ? (
                        <section key={domain.num}>
                            {/* Domain Header */}
                            <div className={`rounded-2xl p-6 mb-6 ${domain.bg} border ${domain.border}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${domain.color} shadow-lg`}>
                                        <DomainIcon className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${domain.badge}`}>
                                                {domain.subtitle}
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${domain.badge}`}>
                                                {t('causes.goalCount', { count: domain.causes.length })}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground">
                                            {t(`causes.domains.${domain.num}.title`)}
                                        </h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {t(`causes.domains.${domain.num}.description`)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Causes Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {domain.causes.map(cause => {
                                    const rdgNum = getRdgNum(cause.websites);
                                    return (
                                        <Link key={cause.id} href={`/causes/${cause.slug}`} className="block group">
                                            <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:${domain.border}`}>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${domain.badge} shrink-0`}>
                                                            RDG {rdgNum}
                                                        </span>
                                                        <ChevronRight className={`w-4 h-4 ${domain.iconColor} opacity-30 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 mt-0.5`} />
                                                    </div>
                                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                                        {cause.title.replace(/^RDG \d+: /, '')}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                                                        {cause.description}
                                                    </p>
                                                    <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                                                        {cause.mainCauseCount > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <span className={`font-bold ${domain.iconColor}`}>{cause.mainCauseCount}</span>
                                                                <span>{t('causes.mainCause')}</span>
                                                            </span>
                                                        )}
                                                        {cause.interestedCount > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <span className={`font-bold ${domain.iconColor}`}>{cause.interestedCount}</span>
                                                                <span>{t('causes.interested')}</span>
                                                            </span>
                                                        )}
                                                        {cause.mainCauseCount === 0 && cause.interestedCount === 0 && (
                                                            <span className="italic">{t('causes.beFirstCard')}</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Subgoals */}
                            {domain.subCauses.length > 0 && (
                                <div className="mt-6">
                                    <div className={`flex items-center gap-3 mb-3 pl-1`}>
                                        <div className={`h-px flex-1 ${domain.border} border-t border-dashed`} />
                                        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${domain.badge} opacity-80`}>
                                            {t('causes.subgoalsTitle')}
                                        </span>
                                        <div className={`h-px flex-1 ${domain.border} border-t border-dashed`} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {domain.subCauses.map(cause => {
                                            const primaryRdg = getRdgNum(cause.websites);
                                            const extraRdgs = getXRdgNums(cause.websites);
                                            return (
                                                <Link key={cause.id} href={`/causes/${cause.slug}`} className="block group">
                                                    <Card className={`h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-dashed ${domain.border} bg-background/60`}>
                                                        <CardHeader className="pb-1 pt-3 px-3">
                                                            <div className="flex flex-wrap items-center gap-1 mb-2">
                                                                <span className="text-xs text-muted-foreground shrink-0">
                                                                    {t('causes.subgoalLinkedTo')}:
                                                                </span>
                                                                {primaryRdg > 0 && (
                                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${domain.badge}`}>
                                                                        RDG {primaryRdg}
                                                                    </span>
                                                                )}
                                                                <ExtraRdgBadges xrdgs={extraRdgs} grouped={grouped} />
                                                            </div>
                                                            <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">
                                                                {cause.title}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="px-3 pb-3 pt-0">
                                                            <p className="text-muted-foreground text-xs line-clamp-2">
                                                                {cause.description}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : null;
                })}

                {/* Uncategorized causes */}
                {uncategorized.length > 0 && (
                    <section>
                        <div className="rounded-2xl p-6 mb-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                                    <HeartHandshake className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{t('causes.uncategorizedTitle')}</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{t('causes.uncategorizedSubtitle')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uncategorized.map(cause => (
                                <Link key={cause.id} href={`/causes/${cause.slug}`} className="block group">
                                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                        <CardHeader>
                                            <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">{cause.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground line-clamp-2 text-sm">{cause.description}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Discovery Topics */}
                {topicCauses.length > 0 && (
                    <section>
                        <div className="rounded-2xl p-6 mb-6 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg">
                                    <Compass className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{t('causes.discoveryTitle')}</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{t('causes.discoverySubtitle')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {topicCauses.map(cause => {
                                const rdgNum = getRdgNum(cause.websites);
                                const domNum = getDomainNum(cause.websites);
                                const domain = grouped.find(d => d.num === domNum);
                                const icon = getTopicIcon(cause.websites);
                                return (
                                    <Link key={cause.id} href={`/causes/${cause.slug}`} className="block group">
                                        <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${domain ? 'hover:' + domain.border : ''}`}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="text-3xl">{icon}</span>
                                                    {rdgNum > 0 && domain && (
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${domain.badge}`}>
                                                            RDG {rdgNum}
                                                        </span>
                                                    )}
                                                </div>
                                                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                                    {cause.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground text-sm line-clamp-3">
                                                    {cause.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
