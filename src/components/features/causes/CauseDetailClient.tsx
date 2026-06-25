'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Globe, CheckCircle2, AlertCircle,
  ArrowLeft, HeartHandshake,
  BookOpen, ExternalLink, ArrowUpRight, Compass, ChevronRight, Loader2
} from 'lucide-react';
import { toggleJoinCause } from '@/app/actions/causes';
import type { CauseDetailClientProps } from './causeDetail.types';
export type {
    CauseDetailClientProps,
    CauseDetailData,
    CauseCommunity,
    CauseDetailUser,
    CauseEvent,
    RelatedCause,
} from './causeDetail.types';
import { DOMAIN_CONFIG, DEFAULT_DOMAIN, getTopicIcon } from './causeDetail.config';

export default function CauseDetailClient({
    cause,
    parentRdg,
    relatedSubCauses,
    relatedTopics,
    domainNum,
    rdgNum,
    refs,
    externalLinks,
    causeIsRdg,
    // _causeIsSubCause,
    // _causeIsTopic,
    displayTitle,
    rdgExplorerUrl,
    initialIsJoined,
}: Readonly<CauseDetailClientProps>) {
    const { t } = useTranslation('common');
    const router = useRouter();
    const [isJoined, setIsJoined] = useState(initialIsJoined);
    const [isPending, startTransition] = useTransition();

    const domain = domainNum > 0 ? (DOMAIN_CONFIG[domainNum] ?? DEFAULT_DOMAIN) : DEFAULT_DOMAIN;
    const DomainIcon = domain.icon;
    const mainCauseUsers = cause.mainCauseUsers ?? [];
    const interestedUsers = cause.interestedUsers ?? [];
    const supportingCommunities = cause.supportingCommunities ?? [];
    const events = cause.events ?? [];
    const managers = cause.managers ?? [];

    function handleJoin() {
        startTransition(async () => {
            const result = await toggleJoinCause(cause.slug);
            if (result.success) {
                setIsJoined(result.joined);
                router.refresh();
            } else if (result.error === 'Not authenticated') {
                router.push('/login');
            }
        });
    }

    // Domain title from locale (only shown if domain is known)
    const domainTitle = domainNum > 0 ? t(`causes.domains.${domainNum}.title`) : t('causes.uncategorizedTitle');

    return (
        <div className="bg-background min-h-screen pb-20">
            {/* Hero Section */}
            <div className={`relative w-full bg-gradient-to-br ${domain.heroBg} py-16 md:py-24`}>
                {cause.coverImage && (
                    <div className="absolute inset-0">
                        <Image src={cause.coverImage} alt={cause.title} fill className="object-cover opacity-20" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                    </div>
                )}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `radial-gradient(circle at 30% 70%, white 0%, transparent 50%), radial-gradient(circle at 70% 30%, white 0%, transparent 50%)`,
                    }}
                />

                <div className="relative container mx-auto px-4 max-w-5xl">
                    {/* Back link */}
                    <Link href="/causes" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        {t('causes.detail.backToCauses')}
                    </Link>

                    <div className="flex items-start gap-6">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${domain.gradient} shadow-lg shadow-emerald-600/20 shrink-0 hidden md:flex`}>
                            <DomainIcon className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                {rdgNum > 0 && (
                                    <span className="text-sm font-bold text-white/60 uppercase tracking-wider">RDG {rdgNum}</span>
                                )}
                                {domainNum > 0 && (
                                    <>
                                        <span className="text-white/40">·</span>
                                        <span className="text-sm text-white/60">{domainTitle}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                                {displayTitle}
                            </h1>
                            {cause.description && (
                                <p className="text-white/80 text-lg max-w-2xl leading-relaxed">
                                    {cause.description.length > 200
                                        ? cause.description.substring(0, 200) + '…'
                                        : cause.description}
                                </p>
                            )}

                            {/* Stats row */}
                            <div className="flex items-center gap-6 mt-6 text-sm text-white/70">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>
                                        <strong className="text-white">{mainCauseUsers.length}</strong>{' '}
                                        {t('causes.detail.mainCause')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>
                                        <strong className="text-white">{supportingCommunities.length}</strong>{' '}
                                        {t('causes.detail.communities')}
                                    </span>
                                </div>
                            </div>

                            {/* RDG Explorer Link */}
                            {rdgExplorerUrl && (
                                <div className="mt-8">
                                    <a
                                        href={rdgExplorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white text-gray-900 hover:bg-white/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <Globe className="w-5 h-5 text-emerald-600" />
                                        {t('causes.detail.rdgExplorer')}
                                        <ExternalLink className="w-4 h-4 opacity-50" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
                <div className="container mx-auto px-4 max-w-5xl py-3 flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                        {mainCauseUsers.length + interestedUsers.length + supportingCommunities.length > 0
                            ? t('causes.detail.actionBarWithMembers', {
                                  members: mainCauseUsers.length + interestedUsers.length,
                                  communities: supportingCommunities.length,
                              })
                            : t('causes.detail.actionBarEmpty')}
                    </div>
        <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={handleJoin}
                            disabled={isPending}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${isJoined ? 'bg-gray-500 hover:bg-gray-600' : domain.buttonBg} flex items-center gap-2 disabled:opacity-70`}
                        >
                            {isPending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <HeartHandshake className="w-4 h-4" />
                            }
                            {isJoined ? t('causes.detail.leaveButton') : t('causes.detail.joinButton')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-10 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        {cause.description && (
                            <section>
                                <h2 className="text-2xl font-bold mb-4 text-foreground">{t('causes.detail.descriptionTitle')}</h2>
                                <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">
                                    {cause.description}
                                </p>
                            </section>
                        )}

                        {/* Problems */}
                        {cause.problems && (
                            <section className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-100 dark:border-red-900/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">{t('causes.detail.problemsTitle')}</h2>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{cause.problems}</p>
                            </section>
                        )}

                        {/* Solutions */}
                        {cause.solutions && (
                            <section className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">{t('causes.detail.solutionsTitle')}</h2>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{cause.solutions}</p>
                            </section>
                        )}

                        {/* Related Communities */}
                        {supportingCommunities.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                                    <Users className="w-6 h-6 text-primary" />
                                    {t('causes.detail.communitiesTitle')}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {supportingCommunities.map(comm => (
                                        <Link key={comm.id} href={`/communities/${comm.id}`} className="block group">
                                            <div className="p-4 border-2 rounded-xl hover:border-primary transition-all duration-200 flex items-center gap-4 bg-card hover:shadow-md">
                                                {comm.coverImage ? (
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image src={comm.coverImage} alt={comm.name} fill className="object-cover" unoptimized />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{comm.name}</h4>
                                                    <span className="text-sm text-muted-foreground">
                                                        {comm.city || t('causes.detail.noLocation')}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-5">
                        {/* Domain / RDG context card */}
                        {domainNum > 0 && (
                            <div className={`rounded-xl border-2 ${domain.border} overflow-hidden`}>
                                <div className={`bg-gradient-to-r ${domain.gradient} p-4`}>
                                    <DomainIcon className="w-6 h-6 text-white mb-1" />
                                    <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
                                        {t('causes.detail.domainLabel', { num: domainNum })}
                                    </p>
                                    <p className="text-white font-semibold text-sm leading-tight">{domainTitle}</p>
                                </div>
                                {rdgNum > 0 && (
                                    <div className="p-3 bg-card">
                                        <p className="text-xs text-muted-foreground">
                                            {causeIsRdg
                                                ? t('causes.detail.rdgFramework', { num: rdgNum })
                                                : t('causes.detail.rdgBelongsTo', { num: rdgNum })}
                                        </p>
                                        {rdgExplorerUrl && (
                                            <a
                                                href={rdgExplorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`mt-3 flex items-center justify-center gap-2 w-full p-2.5 rounded-lg text-xs font-bold border-2 ${domain.border} ${domain.accent} hover:bg-muted/50 transition-all`}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                {t('causes.detail.explorerLink')}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Parent RDG link (sub-cause / topic pages) */}
                        {parentRdg && (
                            <div className={`rounded-xl border-2 ${domain.border} overflow-hidden`}>
                                <div className={`bg-gradient-to-r ${domain.gradient} p-3 flex items-center gap-2`}>
                                    <Compass className="w-4 h-4 text-white" />
                                    <span className="text-white text-xs font-bold uppercase tracking-wide">
                                        {t('causes.detail.relatedRdg')}
                                    </span>
                                </div>
                                <Link href={`/causes/${parentRdg.slug}`} className="block p-4 bg-card hover:bg-muted/50 transition-colors group">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className={`text-xs font-bold mb-1 ${domain.accent}`}>RDG {rdgNum}</p>
                                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                                                {parentRdg.title.replace(/^RDG \d+: /, '')}
                                            </p>
                                            {parentRdg.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{parentRdg.description}</p>
                                            )}
                                        </div>
                                        <ArrowUpRight className={`w-4 h-4 shrink-0 mt-0.5 ${domain.accent}`} />
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Sub-causes & Topics (RDG pages only) */}
                        {causeIsRdg && (relatedSubCauses.length > 0 || relatedTopics.length > 0) && (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="bg-muted/50 p-3 border-b">
                                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                        {t('causes.detail.relatedTitle')}
                                    </p>
                                </div>
                                <div className="divide-y divide-border">
                                    {relatedSubCauses.map(c => (
                                        <Link
                                            key={`sub-${c.id}`}
                                            href={`/causes/${c.slug}`}
                                            className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group"
                                        >
                                            <HeartHandshake className={`w-4 h-4 shrink-0 ${domain.accent}`} />
                                            <span className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                {c.title}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-auto text-muted-foreground" />
                                        </Link>
                                    ))}
                                    {relatedTopics.map(c => {
                                        const icon = getTopicIcon(c.websites);
                                        return (
                                            <Link
                                                key={`topic-${c.id}`}
                                                href={`/causes/${c.slug}`}
                                                className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group"
                                            >
                                                {icon ? (
                                                    <span className="text-lg w-4 shrink-0 flex items-center justify-center">{icon}</span>
                                                ) : (
                                                    <Compass className={`w-4 h-4 shrink-0 ${domain.accent}`} />
                                                )}
                                                <span className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                    {c.title}
                                                </span>
                                                <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-auto text-muted-foreground" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* People */}
                        <div className="p-5 border rounded-xl bg-card">
                            <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-foreground">
                                <Users className="w-5 h-5 text-primary" />
                                {t('causes.detail.peopleTitle')}
                            </h3>

                            {mainCauseUsers.length > 0 ? (
                                <div className="space-y-3">
                                    {mainCauseUsers.slice(0, 6).map(user => (
                                        <Link key={user.id} href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                                            {user.profilePhoto ? (
                                                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all flex-shrink-0">
                                                    <Image
                                                        src={user.profilePhoto}
                                                        alt={user.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border-2 border-transparent group-hover:border-primary transition-all">
                                                    {user.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-medium group-hover:text-primary transition-colors text-sm text-foreground truncate">{user.name}</div>
                                            </div>
                                        </Link>
                                    ))}
                                    {mainCauseUsers.length > 6 && (
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {t('causes.detail.morePersons', { count: mainCauseUsers.length - 6 })}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">{t('causes.detail.noPrimaryMark')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('causes.detail.beFirst')}</p>
                                </div>
                            )}
                        </div>

                        {events.length > 0 && (
                            <div className="p-5 border rounded-xl bg-card">
                                <h3 className="font-bold text-base mb-3 text-foreground">Events</h3>
                                <ul className="space-y-3">
                                    {events.map(event => (
                                        <li key={event.id}>
                                            <Link href={'/events/' + event.id} className="font-medium text-sm text-primary hover:underline">
                                                {event.title}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(event.startDate).toLocaleDateString()} · {event.isOnline ? 'Online' : event.location}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Managers */}
                        {managers.length > 0 && (
                            <div className="p-4 bg-muted/50 rounded-xl border">
                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                                    {t('causes.detail.managersTitle')}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {managers.map(manager => (
                                        <Link key={manager.id} href={'/profile/' + manager.id} className="text-xs bg-background px-2.5 py-1 rounded-md border shadow-sm text-foreground hover:text-primary">
                                            {manager.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* References */}
                        {refs.length > 0 && (
                            <div className="p-5 border rounded-xl bg-card">
                                <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-foreground">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    {t('causes.detail.referencesTitle')}
                                </h3>
                                <ul className="space-y-1.5">
                                    {refs.map((ref) => (
                                        <li key={ref} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-primary mt-0.5">·</span>
                                            <span>{ref}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* External Links */}
                        {externalLinks.length > 0 && (
                            <div className="p-5 border rounded-xl bg-card">
                                <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-foreground">
                                    <Globe className="w-5 h-5 text-primary" />
                                    {t('causes.detail.websitesTitle')}
                                </h3>
                                <ul className="space-y-2">
                                    {externalLinks.map((url) => (
                                        <li key={url}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline flex items-center gap-1.5 truncate"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                {url.replace(/^https?:\/\//, '')}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
