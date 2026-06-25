'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    InPlaceImageEditor
} from '@/components/ui';
import {
    MapPinIcon,
    UsersIcon,
    CalendarIcon,
    GlobeIcon,
    EditIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    UserPlusIcon,
    MailIcon,
    PhoneIcon,
    HeartHandshakeIcon,
    TargetIcon,
    BookOpenIcon,
    ShieldIcon,
    EyeIcon
} from 'lucide-react';
import { requestJoinCommunityAction, leaveCommunityAction, updateCommunityAction } from '@/app/actions/community';
import { type MemberStatus } from '@/lib/prisma-shared';
import { requestClaimAction } from '@/app/actions/claim';
import { useState } from 'react';
import { useAuth } from '@/components/providers';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Community {
    id: string;
    name: string;
    description?: string;
    type: string;
    city?: string;
    country?: string;
    website?: string;
    photoGallery: string[];
    focusAreas: string[];
    memberCount?: number;
    acceptingNewMembers: boolean;
    membershipConditions?: string;
    joiningProcess?: string;
    coverImage?: string;
    createdAt: Date;

    // New fields
    foundingYear?: number;
    contactEmail?: string;
    contactPhone?: string;
    values: string[];

    seekingVolunteers: boolean;
    volunteerDescription?: string;
    volunteerCapabilities: string[];

    targetMemberDescription?: string;
    membershipCost?: string;

    vision?: string;
    principles?: string;
    houseRules?: string;
    annualGoals?: string;

    // Claim info
    source?: 'USER' | 'IMPORT';
    claimStatus?: 'UNCLAIMED' | 'PENDING' | 'CLAIMED' | 'REJECTED';
}

interface PublicCommunityProps {
    community: Community;
    isOwner: boolean;
    isMember: boolean;
    isPending: boolean;
    memberStatus?: MemberStatus | null;
}

export default function PublicCommunity({ community, isOwner, isMember, isPending, memberStatus }: Readonly<PublicCommunityProps>) {
    const { t } = useTranslation(['communities', 'common']);
    const { user } = useAuth();
    const router = useRouter();
    const [joinStatus, setJoinStatus] = useState<'IDLE' | 'LOADING' | 'SENT' | 'ERROR'>('IDLE');
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [showContact, setShowContact] = useState(false);

    const handleJoinRequest = async () => {
        if (!user) return;
        setJoinStatus('LOADING');
        const result = await requestJoinCommunityAction(user.id, community.id);
        if (result.success) {
            setJoinStatus('SENT');
            toast.success(result.message);
        } else {
            console.error(result.error);
            setJoinStatus('ERROR');
            toast.error(result.error);
        }
    };

    const handleLeave = async () => {
        if (!user || !confirm(t('membership.confirmLeave'))) return;
        setLeaveLoading(true);
        const result = await leaveCommunityAction(user.id, community.id);
        if (result.success) {
            toast.success(result.message);
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLeaveLoading(false);
    };

    const handleCoverUpload = async (base64: string) => {
        if (!user) return;
        try {
            const result = await updateCommunityAction(user.id, community.id, {
                coverImage: base64
            });

            if (result.success) {
                toast.success(t('common:messages.saveSuccess'));
                router.refresh();
            } else {
                toast.error(result.error || t('common:errors.saveFailed'));
            }
        } catch {
            toast.error(t('common:errors.saveFailed'));
        }
    };

    const handleClaim = async () => {
        if (!user) return;
        setClaimLoading(true);
        const result = await requestClaimAction('COMMUNITY', community.id);
        if (result.success) {
            toast.success(t('claims.success'));
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setClaimLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link href="/map" className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                {t('common:actions.backToMap')}
            </Link>

            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden h-80 mb-8 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 group">
                <InPlaceImageEditor
                    type="cover"
                    currentImage={community.coverImage || community.photoGallery[0]}
                    isEditable={isOwner}
                    onUpload={handleCoverUpload}
                    className="absolute inset-0 w-full h-full"
                    alt={community.name}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-8 pointer-events-none">
                    <div className="flex-1 text-white pointer-events-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-white border-white/30 bg-black/20 backdrop-blur-sm px-3 py-1">
                                {t(`types.${community.type}`, community.type)}
                            </Badge>
                            {community.acceptingNewMembers && (
                                <Badge className="bg-emerald-500/90 text-white border-none px-3 py-1 shadow-sm backdrop-blur-sm">
                                    {t('membership.accepting')}
                                </Badge>
                            )}
                            {community.seekingVolunteers && (
                                <Badge className="bg-cyan-500/90 text-white border-none px-3 py-1 shadow-sm backdrop-blur-sm">
                                    <HeartHandshakeIcon className="w-3 h-3 mr-1" />
                                    {t('volunteer.seekingBadge')}
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight shadow-black/50 drop-shadow-sm">{community.name}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 font-medium">
                            {(community.city || community.country) && (
                                <span className="flex items-center gap-1.5 backdrop-blur-sm bg-black/10 px-2 py-1 rounded-full">
                                    <MapPinIcon className="h-4 w-4" />
                                    {[community.city, community.country].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {community.foundingYear && (
                                <span className="flex items-center gap-1.5 backdrop-blur-sm bg-black/10 px-2 py-1 rounded-full">
                                    <CalendarIcon className="h-4 w-4" />
                                    {t('details.foundedYear', { year: community.foundingYear })}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 backdrop-blur-sm bg-black/10 px-2 py-1 rounded-full">
                                <UsersIcon className="h-4 w-4" />
                                {t('details.memberCount', { count: community.memberCount || 0 })}
                            </span>
                        </div>
                    </div>

                    {isOwner && (
                        <Link href={`/communities/${community.id}/edit`}>
                            <Button variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
                                <EditIcon className="h-4 w-4 mr-2" />
                                {t('common:actions.edit')}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-10">
                    {/* About */}
                    <div className="prose dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BookOpenIcon className="h-6 w-6 text-emerald-600" />
                            {t('details.about')}
                        </h2>
                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                            {community.description || t('details.noDescription')}
                        </p>
                    </div>

                    {/* Values & Focus Areas */}
                    <div className="space-y-6">
                        {(community.values?.length > 0 || community.focusAreas?.length > 0) && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <TargetIcon className="h-5 w-5 text-emerald-600" />
                                    {t('details.valuesAndTopics')}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {community.values?.map(val => (
                                        <Badge key={val} variant="secondary" className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800">
                                            {val}
                                        </Badge>
                                    ))}
                                    {community.focusAreas?.map(area => (
                                        <Badge key={area} variant="outline" className="px-3 py-1 text-sm">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deep Info Sections */}
                    {(community.vision || community.principles || community.houseRules || community.annualGoals) && (
                        <div className="grid gap-6 md:grid-cols-2 pt-6 border-t">
                            {community.vision && (
                                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                                    <h3 className="font-bold flex items-center gap-2 text-lg">
                                        <EyeIcon className="h-5 w-5 text-cyan-500" />
                                        {t('details.vision')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{community.vision}</p>
                                </div>
                            )}
                            {community.principles && (
                                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                                    <h3 className="font-bold flex items-center gap-2 text-lg">
                                        <ShieldIcon className="h-5 w-5 text-teal-500" />
                                        {t('details.principles')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{community.principles}</p>
                                </div>
                            )}
                            {community.annualGoals && (
                                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                                    <h3 className="font-bold flex items-center gap-2 text-lg">
                                        <TargetIcon className="h-5 w-5 text-red-500" />
                                        {t('details.annualGoals')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{community.annualGoals}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Volunteer Section */}
                    {community.seekingVolunteers && (
                        <Card className="border-cyan-100 bg-cyan-50/30 dark:bg-cyan-900/10 dark:border-cyan-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                                    <HeartHandshakeIcon className="h-5 w-5" />
                                    {t('volunteer.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {community.volunteerDescription && (
                                    <p className="text-gray-700 dark:text-gray-300">{community.volunteerDescription}</p>
                                )}
                                {community.volunteerCapabilities?.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-sm font-semibold text-gray-500">{t('volunteer.helpWith')}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {community.volunteerCapabilities.map(cap => (
                                                <Badge key={cap} className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 border-none">
                                                    {cap}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Button className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white">
                                    {t('volunteer.applyButton')}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Claim Card (Only for IMPORTED & (UNCLAIMED or PENDING)) */}
                    {community.source === 'IMPORT' && (community.claimStatus === 'UNCLAIMED' || community.claimStatus === 'PENDING') && (
                        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-500">
                                    <ShieldIcon className="h-4 w-4" />
                                    {t('claims.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                    {t('claims.description')}
                                </p>
                                {community.claimStatus === 'PENDING' ? (
                                    <Button disabled variant="outline" className="w-full bg-amber-100 text-amber-700 border-amber-200">
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        {t('claims.pending')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleClaim}
                                        disabled={!user || claimLoading}
                                        isLoading={claimLoading}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        {t('claims.submit')}
                                    </Button>
                                )}
                                {!user && (
                                    <p className="text-xs text-center mt-2 text-gray-500">{t('claims.loginRequired')}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}



                    {/* Join / Status Card */}
                    <Card className="shadow-md border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
                        <div className="h-2 bg-emerald-500 w-full" />
                        <CardHeader>
                            <CardTitle className="text-base">{t('membership.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(() => {
                            if (memberStatus === 'BANNED') return (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center font-medium">
                                    {t('membership.banned')}
                                </div>
                            );
                            if (memberStatus === 'REJECTED') return (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center font-medium">
                                    {t('membership.rejected')}
                                </div>
                            );
                            if (isMember) return (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        <span className="font-medium">{t('membership.isMember')}</span>
                                    </div>
                                    {!isOwner && (
                                        <Button
                                            variant="outline"
                                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={handleLeave}
                                            disabled={leaveLoading}
                                        >
                                            {leaveLoading ? t('membership.leaveLoading') : t('membership.leave')}
                                        </Button>
                                    )}
                                </div>
                            );
                            if (isPending || joinStatus === 'SENT') return (
                                <Button className="w-full" disabled variant="outline">
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    {t('membership.requestSent')}
                                </Button>
                            );
                            if (community.acceptingNewMembers) return (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 text-center">
                                        {t('membership.openDescription')}
                                    </p>

                                    {(community.targetMemberDescription || community.membershipCost) && (
                                        <div className="text-sm space-y-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            {community.targetMemberDescription && (
                                                <div>
                                                    <span className="font-semibold block text-xs uppercase tracking-wider text-gray-500 mb-1">{t('membership.targetLabel')}</span>
                                                    {community.targetMemberDescription}
                                                </div>
                                            )}
                                            {community.membershipCost && (
                                                <div>
                                                    <span className="font-semibold block text-xs uppercase tracking-wider text-gray-500 mb-1">{t('membership.costLabel')}</span>
                                                    {community.membershipCost}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                                        onClick={handleJoinRequest}
                                        isLoading={joinStatus === 'LOADING'}
                                        disabled={!user}
                                    >
                                        <UserPlusIcon className="h-4 w-4 mr-2" />
                                        {t('membership.joinButton')}
                                    </Button>
                                </div>
                            );
                            return (
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500">
                                    {t('membership.notAccepting')}
                                </div>
                            );
                            })()}

                            {community.website && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <a
                                        href={community.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 text-sm text-emerald-600 hover:underline"
                                    >
                                        <GlobeIcon className="h-4 w-4" />
                                        {t('contact.website')}
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('contact.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(() => {
                            if (!user) return <p className="text-sm text-gray-500 italic text-center">{t('contact.loginRequired')}</p>;
                            if (!showContact) return (
                                <Button variant="outline" className="w-full" onClick={() => setShowContact(true)}>
                                    {t('contact.showButton')}
                                </Button>
                            );
                            return (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {community.contactEmail ? (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                                                <MailIcon className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <a href={`mailto:${community.contactEmail}`} className="hover:text-emerald-600 hover:underline break-all">
                                                {community.contactEmail}
                                            </a>
                                        </div>
                                    ) : null}
                                    {community.contactPhone ? (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-full">
                                                <PhoneIcon className="h-4 w-4 text-cyan-600" />
                                            </div>
                                            <a href={`tel:${community.contactPhone}`} className="hover:text-cyan-600 hover:underline">
                                                {community.contactPhone}
                                            </a>
                                        </div>
                                    ) : null}
                                    {(!community.contactEmail && !community.contactPhone) && (
                                        <p className="text-sm text-gray-500 text-center">{t('contact.noContact')}</p>
                                    )}
                                </div>
                            );
                            })()}
                        </CardContent>
                    </Card>

                    {/* Quick Info */}
                    <Card>
                        <CardContent className="pt-6 space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">{t('details.foundedLabel')}</span>
                                <span className="font-medium">{community.foundingYear || (community.createdAt ? new Date(community.createdAt).getFullYear() : '-')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">{t('details.country')}</span>
                                <span className="font-medium">{community.country || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('details.city')}</span>
                                <span className="font-medium">{community.city || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {community.houseRules && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BookOpenIcon className="h-4 w-4" />
                                    {t('details.houseRules')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-6">{community.houseRules}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
