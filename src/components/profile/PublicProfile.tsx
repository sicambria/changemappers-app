'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    InPlaceImageEditor
} from '@/components/ui';
import { toast } from 'sonner';
import {
    MapPinIcon,
    EditIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    FlagIcon
} from 'lucide-react';
import { AvailabilityDetailsTable } from '@/components/profile/AvailabilityDetailsTable';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { ActiveBadge } from '@/components/ui/ActiveBadge';
import { ConnectionRequestButton } from '@/components/features/connections/ConnectionRequestButton';
import { ReportUserDialog } from '@/components/features/moderation/ReportUserDialog';
import { updateProfileAction } from '@/app/actions/profile';
import { normalizeFediverseSettings } from '@/lib/federation/settings';
import { safeExternalHref } from '@/lib/url-safety';
import {
    formatAvailabilityDetails,
    formatCollaborationPreferenceList,
    parseStructuredAvailabilityDetails,
} from '@/lib/profile-display-formatting';

interface PublicProfileProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any; // Type strictly if possible, using infer from result
    isOwner: boolean;
    connectionData?: {
        status: string; // ConnectionStatus
        isSender: boolean;
        connectionId?: string;
    };
}

function causeTitle(cause: string | { id?: string; title?: string }): string {
    if (typeof cause === 'string') return cause;
    return cause.title || cause.id || '';
}

function formatRdgArea(rdg: string): string {
    if (/^RDG\d+$/i.test(rdg)) return rdg;
    const cleanText = rdg.includes('_') ? rdg.split('_').slice(1).join(' ') : rdg;
    return cleanText.replaceAll(/([A-Z])/g, ' $1').trim();
}

export default function PublicProfile({ profile, isOwner, connectionData }: Readonly<PublicProfileProps>) {
    const { t, i18n } = useTranslation(['profiles', 'common']);
    const router = useRouter();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const federationSettings = normalizeFediverseSettings(profile.federationSettings);
    // AUDIT-20260613-006: only http(s) values may reach an href, even if a
    // legacy stored link predates input validation.
    const websiteHref = safeExternalHref(profile.website);
    const socialLinks = profile.socialLinks
        ? Object.entries(profile.socialLinks as Record<string, string>)
            .map(([platform, value]) => [platform, safeExternalHref(value)] as const)
            .filter((entry): entry is readonly [string, string] => !!entry[1])
        : [];
    const profileLanguage = i18n.resolvedLanguage ?? i18n.language;
    const structuredAvailability = parseStructuredAvailabilityDetails(profile.availabilityDetails);
    const availabilityLabel = structuredAvailability ? '' : formatAvailabilityDetails(profile.availabilityDetails, profileLanguage);
    const collaborationLabel = formatCollaborationPreferenceList(profile.collaborationPreference, t);

    const handleImageUpload = async (type: 'profilePhoto' | 'coverImage', base64: string) => {
        try {
            const result = await updateProfileAction({
                userId: profile.id,
                [type]: base64
            });

            if (result.success) {
                toast.success(t('common:messages.saveSuccess', 'Saved successfully'));
                router.refresh();
            } else {
                toast.error(result.error || t('common:errors.saveFailed'));
            }
        } catch {
            toast.error(t('common:errors.saveFailed'));
        }
    };

    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/map" className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                {t('common:actions.backToMap', 'Back to map')}
            </Link>

            {/* Profile Header */}
            <div className="mb-8 relative">
                <div className="rounded-2xl h-48 mb-16 relative overflow-visible shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                    <InPlaceImageEditor
                        type="cover"
                        currentImage={profile.coverImage}
                        isEditable={isOwner}
                        onUpload={(base64) => handleImageUpload('coverImage', base64)}
                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 dark:from-gray-800 dark:via-emerald-900/20 dark:to-gray-800"
                        alt="Cover"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-black/45 via-black/20 to-transparent"
                    />

                    {/* Edit Button for Owner - Old one removed as we have in-place editor now, but keeping for other profile settings if any */}
                    {isOwner && (
                        <div className="absolute top-4 right-4 z-10">
                            <Link href="/profile">
                                <Button variant="secondary" size="sm" className="shadow-sm backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
                                    <EditIcon className="h-4 w-4 mr-2" />
                                    {t('common:actions.edit')}
                                </Button>
                            </Link>
                        </div>
                    )}

                    <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                        <InPlaceImageEditor
                            type="profile"
                            currentImage={profile.profilePhoto}
                            isEditable={isOwner}
                            onUpload={(base64) => handleImageUpload('profilePhoto', base64)}
                            className="w-32 h-32 bg-white dark:bg-gray-900 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-lg overflow-hidden"
                            alt={profile.name}
                        />
                        <div
                            data-testid="public-profile-name-plate"
                            className="mb-1 max-w-[calc(100vw-11rem)] rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md dark:border-gray-700/70 dark:bg-gray-950/85 sm:max-w-xl"
                        >
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h1 className="break-words text-3xl font-bold leading-tight text-gray-950 dark:text-white">
                                    {profile.displayName || profile.name}
                                </h1>
                                <ActiveBadge show={profile.isRecentlyActive} />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">

                                {(profile.city || profile.country) && (
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="h-4 w-4" />
                                        {[profile.city, profile.country].filter(Boolean).join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Left Column: Stats & Verifications */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t('individual.basicInfo.joined', 'Csatlakozva')}</span>
                                <span className="font-medium">
                                    {new Date(profile.createdAt).toLocaleDateString(i18n?.language || 'hu')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <VerificationBadge
                                    level={profile.verificationLevel || 'SELF_DECLARED'}
                                    showLabel={true}
                                />
                            </div>
                            {profile.isEmailVerified && (
                                <div className="flex items-center gap-1 text-sm text-emerald-600 mb-2">
                                    <ShieldCheckIcon className="h-4 w-4" />
                                    {t('individual.verification.emailVerified', 'Email verified')}
                                </div>
                            )}
                            {profile.isRemoteCapable && (
                                <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {t('edit.isRemoteCapable', 'Remote / online')}
                                </div>
                            )}
                            {websiteHref && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <a
                                        href={websiteHref}
                                        target="_blank"
                                        rel={federationSettings.verification.relMeLinks ? 'me noopener noreferrer' : 'noopener noreferrer'}
                                        className="text-sm text-emerald-600 hover:underline flex items-center"
                                    >
                                        🔗 {new URL(websiteHref).hostname}
                                    </a>
                                </div>
                            )}
                            {socialLinks.length > 0 && (
                                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                    {socialLinks.map(([platform, value]) => (
                                        <a
                                            key={platform}
                                            href={value}
                                            target="_blank"
                                            rel={federationSettings.verification.relMeLinks ? 'me noopener noreferrer' : 'noopener noreferrer'}
                                            className="block text-sm text-emerald-600 hover:underline"
                                        >
                                            {platform}: {value}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('publicProfile.community.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">{t('publicProfile.community.connections')}</span>
                                <span className="font-bold text-emerald-600">{profile._count.receivedConnections}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">{t('publicProfile.community.communities')}</span>
                                <span className="font-bold text-emerald-600">{profile._count.ownedCommunities}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">{t('publicProfile.community.events')}</span>
                                <span className="font-bold text-emerald-600">{profile._count.hostedEvents}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Bio */}
                    {profile.bio && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('individual.basicInfo.bio', 'Introduction')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {profile.bio}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Offers & Needs (The Exchange) */}
                    {(profile.offers?.length > 0 || profile.needs?.length > 0) && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800">
                                <CardHeader>
                                    <CardTitle className="text-emerald-700 dark:text-emerald-400 text-lg flex items-center">
                                        🎁 {t('edit.offers', 'Amit Adok')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.offers?.length > 0 ? (
                                        <ul className="space-y-2">
                                            {profile.offers.map((offer: string) => (
                                                <li key={offer} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <span className="text-emerald-500 mt-1">•</span>
                                                    {offer}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">{t('profile.noOffers', 'Nincs megadva')}</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800">
                                <CardHeader>
                                    <CardTitle className="text-amber-700 dark:text-amber-400 text-lg flex items-center">
                                        🙏 {t('edit.needs', 'What I need')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.needs?.length > 0 ? (
                                        <ul className="space-y-2">
                                            {profile.needs.map((need: string) => (
                                                <li key={need} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <span className="text-amber-500 mt-1">•</span>
                                                    {need}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">{t('profile.noNeeds', 'Nincs megadva')}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Causes */}
                    {(profile.mainCauses?.length > 0 || profile.interestedCauses?.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('edit.causes', 'Causes')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.mainCauses?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('edit.mainCauses', 'Main causes')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.mainCauses.map((cause: string | { id?: string; title?: string }) => {
                                                const title = causeTitle(cause);
                                                return title ? (
                                                    <span key={title} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-full text-sm border border-rose-100 dark:border-rose-800">
                                                        {title}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                                {profile.interestedCauses?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('edit.interestedCauses', 'Interested causes')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interestedCauses.map((cause: string | { id?: string; title?: string }) => {
                                                const title = causeTitle(cause);
                                                return title ? (
                                                    <span key={title} className="px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-sm border border-violet-100 dark:border-violet-800">
                                                        {title}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* RDG Areas */}
                    {profile.rdgAreas?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profile.page.rdgTitle', 'RDG areas')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {profile.rdgAreas.map((rdg: string) => (
                                        <span key={rdg} className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-sm border border-teal-100 dark:border-teal-800">
                                            {formatRdgArea(rdg)}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Skills & Experience */}
                    {profile.skills?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('edit.skills', 'Skills and experience')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill: string) => (
                                        <span key={skill} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Values & Interests */}
                    {(profile.values?.length > 0 || profile.interests?.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('edit.valuesAndInterests', 'Values and interests')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.values?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('publicProfile.sections.values')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.values.map((val: string) => (
                                                <span key={val} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm border border-indigo-100 dark:border-indigo-800">
                                                    {val}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.interests?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('publicProfile.sections.interests')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map((int: string) => (
                                                <span key={int} className="px-3 py-1 bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 rounded-full text-sm border border-lime-100 dark:border-lime-800">
                                                    {int}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Personal Details (Questionnaire) */}
                    {(profile.enjoyDoing || profile.currentIntention || structuredAvailability || availabilityLabel || profile.constraints || collaborationLabel) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('edit.questionnaire', 'Additional details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                {profile.enjoyDoing && (
                                    <div className="col-span-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{t('publicProfile.details.enjoyDoing')}</h4>
                                        <p className="text-gray-600 dark:text-gray-300">{profile.enjoyDoing}</p>
                                    </div>
                                )}
                                {profile.currentIntention && (
                                    <div className="col-span-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{t('publicProfile.details.currentIntention')}</h4>
                                        <p className="text-gray-600 dark:text-gray-300">{profile.currentIntention}</p>
                                    </div>
                                )}
                                {structuredAvailability && (
                                    <div className="col-span-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('publicProfile.details.availability')}</h4>
                                        <AvailabilityDetailsTable
                                            availability={structuredAvailability}
                                            label={t('publicProfile.details.availability')}
                                            language={profileLanguage}
                                            selectedLabel={t('individual.availability.available', 'Available')}
                                            unselectedLabel={t('individual.availability.unavailable', 'Not available')}
                                        />
                                    </div>
                                )}
                                {availabilityLabel && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{t('publicProfile.details.availability')}</h4>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            {availabilityLabel}
                                        </p>
                                    </div>
                                )}
                                {profile.constraints && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{t('publicProfile.details.constraints')}</h4>
                                        <p className="text-gray-600 dark:text-gray-300">{profile.constraints}</p>
                                    </div>
                                )}
                                {collaborationLabel && (
                                    <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-sm text-gray-500 mr-2">{t('publicProfile.details.collaboration')}:</span>
                                        <span className="text-gray-700 dark:text-gray-300">{collaborationLabel}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Archetype & Level */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{t('individual.archetypes.title')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {profile.archetypes?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.archetypes.map((arch: string) => (
                                            <div key={arch} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-800">
                                                {t(`individual.archetypes.${arch.toLowerCase().replaceAll('_', '')}`)}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">{t('individual.archetypes.notSet')}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{t('individual.changemakeLevel.title')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const levelNum = profile.changemakeLevel?.replace('LEVEL_', '') || '2';
                                    const levelIcons: Record<string, string> = {
                                        '0': '😴', '1': '👀', '2': '♻️', '3': '📢', '4': '🤝',
                                        '5': '💡', '6': '📈', '7': '🔗', '8': '🌀', '9': '🌍'
                                    };
                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-2xl">
                                                {levelIcons[levelNum] || '♻️'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {t(`individual.changemakeLevel.level${levelNum}.name`)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>

                    {!isOwner && (
                        <div className="flex flex-wrap gap-3">
                            <ConnectionRequestButton
                                targetUserId={profile.id}
                                targetUserName={profile.displayName || profile.name}
                                existingStatus={(() => {
                                    if (connectionData?.status === 'ACCEPTED') return 'accepted';
                                    if (connectionData?.status === 'PENDING') return 'pending';
                                    return 'none';
                                })()}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReportOpen(true)}
                                data-testid="profile-report-user-button"
                            >
                                <FlagIcon className="h-4 w-4 mr-2" />
                                {t('common:moderation.reportUser')}
                            </Button>
                            <ReportUserDialog
                                targetId={profile.id}
                                targetType="USER"
                                targetName={profile.displayName || profile.name}
                                isOpen={isReportOpen}
                                onClose={() => setIsReportOpen(false)}
                                onSuccess={() => toast.success(t('common:moderation.reportSuccess'))}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
