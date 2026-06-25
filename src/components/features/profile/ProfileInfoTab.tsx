'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, Button } from '@/components/ui';
import {
    UserIcon,
    MapPinIcon,
    CalendarIcon,
    Building2Icon,
    HeartIcon,
    EditIcon,
    ShieldCheckIcon,
    UsersIcon,
    LinkIcon,
    SparklesIcon,
    ActivityIcon,
    GlobeIcon,
} from 'lucide-react';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { AvailabilityDetailsTable } from '@/components/profile/AvailabilityDetailsTable';
import {
    formatAvailabilityDetails,
    formatCollaborationPreferenceLabel,
    parseStructuredAvailabilityDetails,
} from '@/lib/profile-display-formatting';
import type { AuthUserProfile } from './profile-page-types';

export function ProfileInfoTab({
    user,
    onTakeTest,
}: Readonly<{
    user: AuthUserProfile;
    onTakeTest: (test: 'CHANGEMAKER' | 'ARCHETYPE') => void;
}>) {
    const { t, i18n } = useTranslation(['profiles', 'common']);
    const profileLanguage = i18n.resolvedLanguage ?? i18n.language;
    const structuredAvailability = parseStructuredAvailabilityDetails(user?.availabilityDetails);
    const availabilityLabel = structuredAvailability ? '' : formatAvailabilityDetails(user?.availabilityDetails, profileLanguage);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Section: Basic Info */}
            <section id="basic-info">
                <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.basicInfo.title')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.basicInfo.name')}</p>
                                <p className="font-medium">{user.name}</p>
                            </div>
                        </div>
                        {user.city && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.basicInfo.location')}</p>
                                    <p className="font-medium">{user.city}{user.country ? `, ${user.country}` : ''}</p>
                                </div>
                            </div>
                        )}
                        {user.mainCommunity && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <UsersIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.page.mainCommunity')}</p>
                                    <p className="font-medium">{user.mainCommunity}</p>
                                </div>
                            </div>
                        )}
                        {user.motto && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <HeartIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.basicInfo.motto')}</p>
                                    <p className="font-medium">{user.motto}</p>
                                </div>
                            </div>
                        )}
                        {user.timezone && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.basicInfo.timezone')}</p>
                                    <p className="font-medium">{user.timezone}</p>
                                </div>
                            </div>
                        )}
                        {user.organizationName && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Building2Icon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.basicInfo.organizationName')}</p>
                                    <p className="font-medium">{user.organizationName}</p>
                                </div>
                            </div>
                        )}
                        {user.organizationDescription && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Building2Icon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.basicInfo.organizationDescription')}</p>
                                    <p className="font-medium">{user.organizationDescription}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('individual.verification.title')}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <VerificationBadge
                                        level={(user.verificationLevel as 'SELF_DECLARED' | 'PEER_VOUCHED' | 'COMMUNITY_VERIFIED' | 'ADMIN_VERIFIED') || 'SELF_DECLARED'}
                                        showLabel={true}
                                    />
                                    {user.isEmailVerified && (
                                        <span className="text-sm text-emerald-600 flex items-center gap-1">
                                            ✓ {t('individual.verification.emailVerified')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Section: Bio */}
            <section id="bio">
                <div className="flex items-center gap-2 mb-3">
                    <EditIcon className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.basicInfo.bio')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap italic">
                            &quot;{user.bio || t('profile.page.noBio')}&quot;
                        </p>
                        {(user.website || (user.socialLinks && Object.values(user.socialLinks).some(Boolean))) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {user.website && (
                                    <a href={user.website} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                                        <LinkIcon className="h-3.5 w-3.5" />
                                        {t('profile.page.website')}
                                    </a>
                                )}
                                {user.socialLinks && (Object.entries(user.socialLinks)).map(([platform, url]) => {
                                    if (!url) return null;
                                    const labels: Record<string, string> = {
                                        linkedin: 'LinkedIn', twitter: 'Twitter/X', facebook: 'Facebook',
                                        instagram: 'Instagram', youtube: 'YouTube', github: 'GitHub',
                                        mastodon: 'Mastodon', substack: 'Substack', telegram: 'Telegram',
                                    };
                                    return (
                                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                                            <LinkIcon className="h-3.5 w-3.5" />
                                            {labels[platform] ?? platform}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Section: Archetypes */}
            <section id="archetypes">
                <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.archetypes.title')}</h2>
                </div>
                <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <CardContent className="p-5">
                        {(user.archetypes?.length ?? 0) > 0 ? (
                            <>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {user.archetypes?.map((arch: string) => {
                                        const iconMap: Record<string, string> = {
                                            'LOCAL_PRACTITIONER': '🏡', 'NETWORK_WEAVER': '🕸️',
                                            'INSTITUTIONAL_CHANGEMAKER': '🏛️', 'GLOBAL_AMPLIFIER': '📢',
                                            'RESOURCE_MOBILIZER': '💰', 'INNOVATION_CATALYST': '💡',
                                            'SYSTEM_DISRUPTOR': '⚡', 'STRATEGIC_ADVISOR': '🎯',
                                            'MYCELIUM': '🍄', 'KEYSTONE': '🪨',
                                            'POLLINATOR': '🌸', 'PRISM': '🔮',
                                            'COMPOST': '♻️', 'SENTINEL': '🛡️',
                                            'ALCHEMIST': '⚗️', 'CANOPY': '🌳',
                                            'SPARK': '⚡', 'ECHO': '📣',
                                            'TIDE': '🌊', 'HORIZON': '🌅',
                                        };
                                        return (
                                            <div key={arch} className="bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-sm font-medium border border-emerald-100 dark:border-emerald-800 shadow-sm flex items-center gap-2">
                                                <span>{iconMap[arch] || '✨'}</span>
                                                {t(`individual.archetypes.${arch.toLowerCase().replaceAll('_', '')}`)}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => onTakeTest('ARCHETYPE')} className="text-emerald-700 dark:text-emerald-400">
                                        <EditIcon className="h-4 w-4 mr-2" /> {t('profile.page.retakeTest')}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 dark:text-gray-400 mb-3">{t('individual.archetypes.notSet')}</p>
                                <Button variant="outline" size="sm" onClick={() => onTakeTest('ARCHETYPE')}>
                                    {t('individual.archetypes.takeQuiz')}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Section: Changemaker Level */}
            <section id="changemaker-level">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🌱</span>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.changemakeLevel.title')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5">
                        {(() => {
                            const levelNum = user.changemakeLevel?.replace('LEVEL_', '') || '2';
                            const levelIcons: Record<string, string> = {
                                '0': '😴', '1': '👀', '2': '♻️', '3': '📢', '4': '🤝',
                                '5': '💡', '6': '📈', '7': '🔗', '8': '🌀', '9': '🌍',
                            };
                            return (
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                                        {levelIcons[levelNum] || '♻️'}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {t(`individual.changemakeLevel.level${levelNum}.name`)}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t(`individual.changemakeLevel.level${levelNum}.quality`)}
                                        </p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium italic">
                                            {t(`individual.changemakeLevel.level${levelNum}.mindset`)}
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => onTakeTest('CHANGEMAKER')}>
                                            {t('profile.page.assessLevel')}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </section>

            {/* Section: Skills & Values */}
            <section id="skills" className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🛠️</span>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('individual.skills.title')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 grid gap-6 md:grid-cols-3">
                        <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-500">{t('individual.skills.offered')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {user.skills?.filter((s) => s.skillType === 'OFFERED').map((s) => (
                                    <span key={s.id} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs border border-emerald-100">
                                        {t([`individual.skillsList.${s.skill.toLowerCase()}`, `individual.offers.${s.skill.toLowerCase()}`], { defaultValue: '' }) || s.skill}
                                    </span>
                                )) || <p className="text-xs text-gray-400 italic">{t('profile.page.notSet')}</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-500">{t('individual.skills.seeking')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {user.skills?.filter((s) => s.skillType === 'SEEKING').map((s) => (
                                    <span key={s.id} className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded text-xs border border-amber-100">
                                        {t([`individual.seeking.${s.skill.toLowerCase()}`, `individual.skillsList.${s.skill.toLowerCase()}`], { defaultValue: '' }) || s.skill}
                                    </span>
                                )) || <p className="text-xs text-gray-400 italic">{t('profile.page.notSet')}</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-500">{t('individual.values.title')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {user.values?.map((v) => (
                                    <span key={v.id} className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs border border-purple-100">
                                        {t(`individual.valuesList.${v.value.toLowerCase()}`, { defaultValue: '' }) || v.value}
                                    </span>
                                )) || <p className="text-xs text-gray-400 italic">{t('profile.page.notSet')}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Section: Causes */}
            {((user.mainCauses?.length ?? 0) > 0 || (user.interestedCauses?.length ?? 0) > 0) && (
                <section id="causes" className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                        <HeartIcon className="w-4 h-4 text-rose-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('edit.causes', 'Causes')}</h2>
                    </div>
                    <Card>
                        <CardContent className="p-5 grid gap-6 md:grid-cols-2">
                            {(user.mainCauses?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">{t('edit.mainCauses', 'Main causes')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.mainCauses?.map((cause) => (
                                            <span key={cause.id} className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-2 py-1 rounded text-xs border border-rose-100 dark:border-rose-800">
                                                {cause.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(user.interestedCauses?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">{t('edit.interestedCauses', 'Interested causes')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.interestedCauses?.map((cause) => (
                                            <span key={cause.id} className="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded text-xs border border-violet-100 dark:border-violet-800">
                                                {cause.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Section: RDG Areas */}
            {(user.rdgAreas?.length ?? 0) > 0 && (
                <section id="rdg-areas" className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                        <GlobeIcon className="w-4 h-4 text-teal-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.rdgTitle')}</h2>
                    </div>
                    <Card className="border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-900/10">
                        <CardContent className="p-5">
                            <div className="flex flex-wrap gap-2">
                                {user.rdgAreas?.map((rdg: string) => {
                                    const cleanText = rdg.includes('_') ? rdg.split('_').slice(1).join(' ') : rdg;
                                    return (
                                        <span key={rdg} className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 rounded-lg text-sm border border-teal-200 dark:border-teal-800">
                                            {cleanText.replaceAll(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Section: Intentions & Availability */}
            <section id="intentions" className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                    <ActivityIcon className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.intentionsTitle')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 grid gap-6 md:grid-cols-2">
                        {user.currentIntention && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.currentFocus')}</p>
                                <p className="text-gray-800 dark:text-gray-200">{user.currentIntention}</p>
                            </div>
                        )}
                        {user.enjoyDoing && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.enjoysTitle')}</p>
                                <p className="text-gray-800 dark:text-gray-200">{user.enjoyDoing}</p>
                            </div>
                        )}
                        {(user.collaborationPreference?.length ?? 0) > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.collaborationTitle')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {user.collaborationPreference?.map((pref: string) => (
                                        <span key={pref} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-100 dark:border-blue-800">
                                            {formatCollaborationPreferenceLabel(pref, t)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {user.isRemoteCapable && (
                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {t('profile.page.remoteCapable')}
                            </div>
                        )}
                        {structuredAvailability && (
                            <div className="space-y-2 md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('individual.availability.title')}</p>
                                <AvailabilityDetailsTable
                                    availability={structuredAvailability}
                                    label={t('individual.availability.title')}
                                    language={profileLanguage}
                                    selectedLabel={t('individual.availability.available', 'Available')}
                                    unselectedLabel={t('individual.availability.unavailable', 'Not available')}
                                />
                            </div>
                        )}
                        {availabilityLabel && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('individual.availability.title')}</p>
                                <p className="text-gray-800 dark:text-gray-200">{availabilityLabel}</p>
                            </div>
                        )}
                        {user.constraints && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">{t('profile.page.constraintsTitle')}</p>
                                <p className="text-xs text-amber-800 dark:text-amber-300 italic">{user.constraints}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
