'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ensureI18nLanguage } from '@/lib/i18n';
import { Button, Card, CardContent } from '@/components/ui';
import {
    MapIcon,
    UsersIcon,
    ArrowRightIcon,
    CalendarIcon} from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ActiveBadge } from '@/components/ui/ActiveBadge';

// Dynamically import DiscoveryMap to avoid SSR issues with Leaflet
const DiscoveryMap = dynamic(
    () => import('@/components/map/DiscoveryMap').then((mod) => mod.DiscoveryMap),
    {
        ssr: false,
        loading: () => (
            <div
                data-testid="homepage-map-loading"
                className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400"
            >
                ...
            </div>
        )
    }
);


import type { MapEntity } from '@/app/actions/map';
import { Z_CLASS } from '@/lib/z-index';

interface HomePageClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    featuredCommunities?: any[];
    mapEntities?: MapEntity[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentUsers?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upcomingEvents?: any[];
    stats?: {
        users: number;
        communities: number;
        events: number;
    };
    initialLanguage?: string | null;
}

export function HomePageClient({
    featuredCommunities = [],
    mapEntities: initialMapEntities = [],
    recentUsers = [],
    upcomingEvents = [],
    stats,
    initialLanguage,
}: Readonly<HomePageClientProps>) {
    if (initialLanguage) {
        ensureI18nLanguage(initialLanguage, true);
    }

    const { t } = useTranslation(['common', 'profiles']);
    const { language } = useLanguage();
    const [animatedStats, setAnimatedStats] = useState({ users: 0, communities: 0, events: 0 });
    const [mapEntities] = useState<MapEntity[]>(initialMapEntities);
    const [isMapLoading] = useState(false);

    useEffect(() => {
        if (stats) {
            const duration = 2000;
            const steps = 50;
            const interval = duration / steps;
            let current = 0;
            const timer = setInterval(() => {
                current++;
                setAnimatedStats({
                    users: Math.min(Math.floor((stats.users / steps) * current), stats.users),
                    communities: Math.min(Math.floor((stats.communities / steps) * current), stats.communities),
                    events: Math.min(Math.floor((stats.events / steps) * current), stats.events),
                });
                if (current >= steps) clearInterval(timer);
            }, interval);
            return () => clearInterval(timer);
        }
    }, [stats]);

    // Typewriter effect state
    const rolesArray = useMemo(() => {
        const raw = t('heroRoles', { returnObjects: true });
        return Array.isArray(raw) ? raw : ['jovokepzoket', 'alkotokat', 'ujitokat', 'kozossegszervezoket', 'ertekteremtoket', 'cselekvoket'];
    }, [t]);
    // §1B memo-laundered-storm fix: the typewriter effect below must NOT depend on `rolesArray`'s
    // identity (it churns whenever `t` re-identifies, tearing down/recreating the ticker every render).
    // Mirror the array in a ref synced after render and read it inside the effect, so the effect depends
    // only on the animation's own state. A real language switch updates the ref for the next tick.
    const rolesRef = useRef(rolesArray);
    useEffect(() => { rolesRef.current = rolesArray; });

    const [currentWord, setCurrentWord] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const roles = rolesRef.current;
        const i = loopNum % roles.length;
        const fullText = roles[i] + "!";

        const ticker = setTimeout(() => {
            setCurrentWord(prev =>
                isDeleting ? fullText.substring(0, prev.length - 1) : fullText.substring(0, prev.length + 1)
            );

            // Set speed for typing vs deleting
            setTypingSpeed(isDeleting ? 50 : 150);

            // Check if word is fully typed or fully deleted
            if (!isDeleting && currentWord === fullText) {
                // Pause at the end of word before starting to delete
                setTypingSpeed(2000);
                setIsDeleting(true);
            } else if (isDeleting && currentWord === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                // Pause slightly before typing the next word
                setTypingSpeed(500);
            }
        }, typingSpeed);

        return () => clearTimeout(ticker);
    }, [currentWord, isDeleting, loopNum, typingSpeed]);

    const topics = useMemo(() => [
        { key: 'permaculture', slug: 'topic-permaculture', name: t('home.topics.permaculture'), icon: '🌱', count: '12' },
        { key: 'ecoArchitecture', slug: 'topic-eco-architecture', name: t('home.topics.ecoArchitecture'), icon: '🏠', count: '8' },
        { key: 'communityBuilding', slug: 'topic-community-building', name: t('home.topics.communityBuilding'), icon: '🤝', count: '15' },
        { key: 'localEconomy', slug: 'topic-local-economy', name: t('home.topics.localEconomy'), icon: '💰', count: '5' },
        { key: 'education', slug: 'topic-education', name: t('home.topics.education'), icon: '📚', count: '7' },
        { key: 'health', slug: 'topic-health', name: t('home.topics.health'), icon: '❤️', count: '9' },
        { key: 'spirituality', slug: 'topic-spirituality', name: t('home.topics.spirituality'), icon: '✨', count: '6' },
        { key: 'renewableEnergy', slug: 'topic-renewable-energy', name: t('home.topics.renewableEnergy'), icon: '⚡', count: '4' },
    ], [t]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section with Map */}
            <section className="relative w-full flex flex-col md:flex-row md:h-[65vh]">

                {/* Overlay / Sidebar Content */}
                <div className={`md:absolute md:top-20 md:left-20 ${Z_CLASS.mapOverlayMd} p-6 md:p-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg md:shadow-2xl md:rounded-2xl md:max-w-lg md:mr-8 border-b md:border border-gray-100 md:border-emerald-100/20`}>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white mb-4">
                        <span className="block text-emerald-600 dark:text-emerald-400">
                            Changemappers
                        </span>
                        <span className="block h-16 md:h-12 text-2xl md:text-3xl mt-2 font-medium text-slate-600 dark:text-slate-300">
                            {t('home.heroDiscover')} <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentWord}</span>
                        </span>
                    </h1>

                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 mb-6">
                        {t('home.heroSubtitle')}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8 border-y border-gray-100 dark:border-gray-800 py-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">{animatedStats.users}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('home.stats.users')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-teal-600">{animatedStats.communities}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('home.stats.communities')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-600">{animatedStats.events}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('home.stats.events')}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/register" className="flex-1">
                            <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                                {t('home.joinCta')}
                            </Button>
                        </Link>
                        <Link href="/map" className="flex-1">
                            <Button size="lg" variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                                {t('home.mapCta')}
                                <MapIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Map Container */}
                <div
                    data-testid="homepage-map"
                    className="flex-1 relative w-full h-[55vw] max-h-[60vh] md:h-full md:max-h-none min-h-[280px] bg-slate-50 overflow-hidden"
                >
                    {isMapLoading ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/50 backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-medium text-slate-500">{t('home.dataLoading')}</span>
                            </div>
                        </div>
                    ) : null}
                    <DiscoveryMap entities={mapEntities} initialZoom={3} />
                </div>
            </section>

            {/* Recent Users */}
            {recentUsers.length > 0 && (
                <section className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.newMembers.title')}</h2>
                                <p className="text-gray-500 mt-1">{t('home.newMembers.subtitle')}</p>
                            </div>
                            <Link href="/map?filter=users">
                                <Button variant="ghost" className="text-teal-600">{t('home.newMembers.viewAll')} <ArrowRightIcon className="ml-1 h-4 w-4" /></Button>
                            </Link>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentUsers.slice(0, 6).map(user => (
                                <Link href={`/profile/${user.id}`} key={user.id} className="group">
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-gray-50 dark:bg-gray-800 flex flex-col">
                                        <div className="h-32 relative bg-teal-100 dark:bg-teal-900/30">
                                            <div className="absolute inset-0 overflow-hidden">
                                                {user.coverImage ? (
                                                    <Image src={user.coverImage} alt={t('home.coverImageAlt')} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : null}
                                            </div>
                                            <div className="absolute -bottom-6 left-5">
                                                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 bg-teal-50 dark:bg-teal-900/30 overflow-hidden relative flex items-center justify-center">
                                                    {user.profilePhoto ? (
                                                        <Image src={user.profilePhoto} alt={user.name} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                                                            {(user.displayName || user.name || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <CardContent className="pt-10 pb-5 px-5 flex-1 flex flex-col">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">
                                                    {user.displayName || user.name}
                                                </h3>
                                                <ActiveBadge show={user.isRecentlyActive} />
                                            </div>

                                            {user.bio && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 flex-1">
                                                    {user.bio}
                                                </p>
                                            )}
                                            {user.archetypes?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 mt-auto pt-2">
                                                    {user.archetypes.slice(0, 3).map((arch: string) => (
                                                        <span key={arch} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800">
                                                            {arch}
                                                        </span>
                                                    ))}
                                                    {user.archetypes.length > 3 && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                            +{user.archetypes.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-auto pt-2"></div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Communities */}
            {featuredCommunities.length > 0 && (
                <section className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.communities.title')}</h2>
                                <p className="text-gray-500 mt-1">{t('home.communities.subtitle')}</p>
                            </div>
                            <Link href="/map?filter=communities">
                                <Button variant="ghost" className="text-emerald-600">{t('home.communities.viewAll')} <ArrowRightIcon className="ml-1 h-4 w-4" /></Button>
                            </Link>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredCommunities.map((community) => (
                                <Link href={`/communities/${community.id}`} key={community.id} className="group">
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-gray-50 dark:bg-gray-800">
                                        <div className="h-48 overflow-hidden relative">
                                            {community.photoGallery?.[0] ? (
                                                <Image
                                                    src={community.photoGallery[0]}
                                                    alt={community.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                    <UsersIcon className="h-12 w-12 text-emerald-300" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
                                                {community.type}
                                            </div>
                                        </div>
                                        <CardContent className="p-5">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">
                                                {community.name}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                                <MapIcon className="h-4 w-4 mr-1" />
                                                {[community.city, community.country].filter(Boolean).join(', ')}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent Activity: Events */}
            {upcomingEvents.length > 0 && (
                <section className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.events.title')}</h2>
                                <p className="text-gray-500 mt-1">{t('home.events.subtitle')}</p>
                            </div>
                            <Link href="/events">
                                <Button variant="ghost" className="text-emerald-600">{t('home.events.viewAll')} <ArrowRightIcon className="ml-1 h-4 w-4" /></Button>
                            </Link>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {upcomingEvents.slice(0, 3).map((event) => (
                                <Link href={`/events/${event.id}`} key={event.id} className="group">
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-gray-50 dark:bg-gray-800 flex flex-col">
                                        <div className="h-48 overflow-hidden relative">
                                            {event.coverImage ? (
                                                <Image
                                                    src={event.coverImage}
                                                    alt={event.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                    <CalendarIcon className="h-12 w-12 text-emerald-300" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-emerald-700 dark:text-emerald-400">
                                                {new Date(event.startDate).toLocaleDateString(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <CardContent className="p-5 flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">
                                                {event.title}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                                <MapIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                                <span className="truncate">
                                                    {event.location || (event.isOnline ? t('home.events.online') : t('home.events.noLocation'))}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Topics Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('home.topics.title')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {topics.map((topic) => (
                            <Link href={`/causes/${topic.slug}`} key={topic.key}>
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 group cursor-pointer text-center h-full">
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">{topic.icon}</div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600">{topic.name}</h3>
                                    <p className="text-xs text-gray-500">{t('home.topics.results', { count: Number(topic.count) })}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
