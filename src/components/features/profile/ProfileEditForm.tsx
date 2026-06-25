'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from '@/components/ui';
import { ValidationRule } from '@/hooks/useFieldValidation';
import {
  SaveIcon,
  XIcon,
  CheckIcon,
} from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';
import { getCauses } from '@/app/actions/causes';
import { useValidationErrors } from '@/hooks/useValidationErrors';

import { ProfilePhotoSection } from './ProfilePhotoSection';
import { ProfileBasicSection } from './ProfileBasicSection';
import { ProfileSocialLinks } from './ProfileSocialLinks';
import { Z_CLASS } from '@/lib/z-index';
import { AvailabilityMatrixGrid } from './AvailabilityMatrix';
import { TagSelector } from './TagSelector';
import {
    profileSchema,
    BASE_ARCHETYPE_IDS,
    BASE_ARCHETYPES,
    EXTRA_ARCHETYPE_ICONS,
    SKILLS_OPTIONS,
    OFFERS_OPTIONS,
    NEEDS_OPTIONS,
    VALUES_OPTIONS,
    INTERESTS_OPTIONS,
    COLLAB_OPTIONS,
    parseAvailability,
    type ProfileFormData,
    type ProfileCauseOption,
    type ProfileSkillEntry,
    type ProfileEditFormProps,
} from './profile-form-schema';

export function ProfileEditForm({ user, onClose, onSave }: Readonly<ProfileEditFormProps>) {
  const { t } = useTranslation(['profiles', 'common', 'validation']);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setErrors, getFieldError } = useValidationErrors();
  const [causesList, setCausesList] = useState<ProfileCauseOption[]>([]);

  const displayNameRules: ValidationRule[] = [
    { type: 'required', message: t('validation:required') },
    { type: 'minLength', value: 2, message: t('validation:minLength', { min: 2 }) },
    { type: 'maxLength', value: 50, message: t('validation:maxLength', { max: 50 }) },
  ];

  const websiteRules: ValidationRule[] = [
    { type: 'url', message: t('validation:url') },
  ];

  useEffect(() => {
    getCauses().then((res) => {
      if (res.success && res.data) setCausesList(res.data);
    });
  }, []);

    const getInitialSkills = (type: ProfileSkillEntry['skillType']) =>
        user.skills?.filter((s) => s.skillType === type).map((s) => s.skill).join(', ') || '';

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        getValues,
        control,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        mode: 'onTouched',
        defaultValues: {
            displayName: user.displayName || user.name,
            bio: user.bio || '',
            location: user.city || user.location || '',
            country: user.country || '',
            latitude: user.latitude,
            longitude: user.longitude,

            isRemoteCapable: user.isRemoteCapable || false,

            skills: getInitialSkills('EXPERIENCE'),
            offers: getInitialSkills('OFFERED'),
            needs: getInitialSkills('SEEKING'),
            values: user.values?.map((v) => typeof v === 'string' ? v : v.value).join(', ') || '',
            interests: user.interests?.map((i) => typeof i === 'string' ? i : i.interest).join(', ') || '',

            enjoyDoing: user.enjoyDoing || '',
            currentIntention: user.currentIntention || '',
            constraints: user.constraints || '',
            availabilityDetails: parseAvailability(user.availabilityDetails),
            collaborationPreference: user.collaborationPreference?.join(', ') || '',

            seekingLocalEcoCommunity: user.seekingLocalEcoCommunity || false,
            seekingIntentionalCommunity: user.seekingIntentionalCommunity || false,
            highStakesProjectHelp: user.highStakesProjectHelp || false,
            strictNoRomance: user.strictNoRomance || false,

            website: user.website || '',
            socialLinks: {
                linkedin:  user.socialLinks?.linkedin  || '',
                twitter:   user.socialLinks?.twitter   || '',
                facebook:  user.socialLinks?.facebook  || '',
                instagram: user.socialLinks?.instagram || '',
                youtube:   user.socialLinks?.youtube   || '',
                github:    user.socialLinks?.github    || '',
                mastodon:  user.socialLinks?.mastodon  || '',
                diaspora:  user.socialLinks?.diaspora  || '',
                pixelfed:  user.socialLinks?.pixelfed  || '',
                substack:  user.socialLinks?.substack  || '',
                telegram:  user.socialLinks?.telegram  || '',
            },
            // Only pre-fill BASE archetypes in the form field — EXTRA (quiz) ones are shown read-only
            archetypes: (user.archetypes || []).filter((a: string) => BASE_ARCHETYPE_IDS.has(a)),
            profilePhoto: user.profilePhoto || '',
            coverImage: user.coverImage || '',
            mainCauses: (user.mainCauses || []).map((c) => typeof c === 'string' ? c : c?.id).filter(Boolean),
            interestedCauses: (user.interestedCauses || []).map((c) => typeof c === 'string' ? c : c?.id).filter(Boolean),
            mainCommunity: user.mainCommunity || '',
        },
    });

    const profilePhoto = useWatch({ control, name: 'profilePhoto' });
    const coverImage = useWatch({ control, name: 'coverImage' });
    const skills = useWatch({ control, name: 'skills' }) || '';
    const offers = useWatch({ control, name: 'offers' }) || '';
    const needs = useWatch({ control, name: 'needs' }) || '';
    const values = useWatch({ control, name: 'values' }) || '';
    const interests = useWatch({ control, name: 'interests' }) || '';
    const availabilityDetails = useWatch({ control, name: 'availabilityDetails' }) || {};
    const seekingLocalEcoCommunity = useWatch({ control, name: 'seekingLocalEcoCommunity' });
    const seekingIntentionalCommunity = useWatch({ control, name: 'seekingIntentionalCommunity' });
    const highStakesProjectHelp = useWatch({ control, name: 'highStakesProjectHelp' });
    const strictNoRomance = useWatch({ control, name: 'strictNoRomance' });
    const collaborationPreference = useWatch({ control, name: 'collaborationPreference' }) || '';
    const selectedCollaborationPreferences = collaborationPreference
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const selectedArchetypes = useWatch({ control, name: 'archetypes' }) || [];
    const selectedMainCauses = useWatch({ control, name: 'mainCauses' }) || [];
    const selectedInterestedCauses = useWatch({ control, name: 'interestedCauses' }) || [];

    const onSubmit = async (data: ProfileFormData) => {
        setIsSubmitting(true);
        setError(null);

        const payload = {
            displayName: data.displayName,
            bio: data.bio,
            city: data.location,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
            website: data.website || null,
            socialLinks: data.socialLinks
                ? Object.fromEntries(
                    Object.entries(data.socialLinks).filter(([, v]) => v && (v).trim() !== '')
                  )
                : null,
            profilePhoto: data.profilePhoto || undefined,
            coverImage: data.coverImage || undefined,
            archetypes: data.archetypes,
            skills:    data.skills?.split(',').map(s => s.trim()).filter(Boolean),
            offers:    data.offers?.split(',').map(s => s.trim()).filter(Boolean),
            needs:     data.needs?.split(',').map(s => s.trim()).filter(Boolean),
            interests: data.interests?.split(',').map(s => s.trim()).filter(Boolean),
            values:    data.values?.split(',').map(s => s.trim()).filter(Boolean),
            isRemoteCapable: data.isRemoteCapable,
            enjoyDoing: data.enjoyDoing,
            currentIntention: data.currentIntention,
            constraints: data.constraints,
            availabilityDetails: data.availabilityDetails,
            collaborationPreference: data.collaborationPreference?.split(',').map(s => s.trim()).filter(Boolean),
            
            seekingLocalEcoCommunity: data.seekingLocalEcoCommunity,
            seekingIntentionalCommunity: data.seekingIntentionalCommunity,
            highStakesProjectHelp: data.highStakesProjectHelp,
            strictNoRomance: data.strictNoRomance,

            mainCauses: data.mainCauses,
            interestedCauses: data.interestedCauses,
            mainCommunity: data.mainCommunity,
        };


        try {
            const result = await updateProfileAction({ userId: user.id, ...payload });
            if (result.success) {
                router.refresh();
                onSave?.();
                onClose();
            } else {
                setErrors(result);
                setError(result.error || t('common:errors.saveFailed'));
            }
        } catch {
            setError(t('common:errors.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = handleSubmit(onSubmit, () => {
        setError(t('common:errors.validationFailed'));
    });

    return (
        <div
            className={`fixed inset-0 ${Z_CLASS.profileModal} flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}
            data-testid="profile-edit-modal"
        >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                    <CardTitle>{t('edit.title')}</CardTitle>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        aria-label={t('common:actions.close')}
                        data-testid="profile-edit-close"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent className="pt-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}
                    {getFieldError('displayName') && (
                        <p className="mb-2 text-xs text-red-500">{getFieldError('displayName')}</p>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-6">

                        {/* ── Photo & Cover ─────────────────────────────────── */}
                        <ProfilePhotoSection
                            profilePhoto={profilePhoto}
                            coverImage={coverImage}
                            setValue={setValue}
                        />

                        {/* ── Basic Info (name, bio, location, website, community, remote) ── */}
                        <ProfileBasicSection
                            register={register}
                            setValue={setValue}
                            watch={watch}
                            errors={errors}
                            displayNameRules={displayNameRules}
                            websiteRules={websiteRules}
                        />

                        {/* ── Social Links ──────────────────────────────────── */}
                        <ProfileSocialLinks register={register} />

                        {/* ── Skills ────────────────────────────────────────── */}
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t('individual.skills.title')}
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('individual.skills.offered')}</label>
                                <TagSelector value={skills} onChange={v => setValue('skills', v, { shouldDirty: true })} options={SKILLS_OPTIONS} translationPrefix="individual.skillsList" placeholder={t('edit.placeholders.skills')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('individual.offers.title')}</label>
                                <TagSelector value={offers} onChange={v => setValue('offers', v, { shouldDirty: true })} options={OFFERS_OPTIONS} translationPrefix="individual.offers" placeholder={t('edit.placeholders.offers')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('individual.seeking.title')}</label>
                                <TagSelector value={needs} onChange={v => setValue('needs', v, { shouldDirty: true })} options={NEEDS_OPTIONS} translationPrefix="individual.seeking" placeholder={t('edit.placeholders.needs')} />
                            </div>
                        </div>

                        {/* ── Values & Interests ────────────────────────────── */}
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t('individual.values.title')} & {t('individual.interests.title')}
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('individual.values.title')}</label>
                                <TagSelector value={values} onChange={v => setValue('values', v, { shouldDirty: true })} options={VALUES_OPTIONS} translationPrefix="individual.valuesList" placeholder={t('edit.placeholders.values')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('individual.interests.title')}</label>
                                <TagSelector value={interests} onChange={v => setValue('interests', v, { shouldDirty: true })} options={INTERESTS_OPTIONS} translationPrefix="individual.interests" placeholder={t('edit.placeholders.interests')} />
                            </div>
                        </div>

                        {/* ── Questionnaire ─────────────────────────────────── */}
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('edit.profileDetails')}</h3>

                            {/* Availability Matrix */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('edit.availability.title')}
                                </label>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                    <AvailabilityMatrixGrid
                                        value={availabilityDetails}
                                        onChange={v => setValue('availabilityDetails', v, { shouldDirty: true })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('edit.enjoyDoing')}
                                    </label>
                                    <Input {...register('enjoyDoing')} placeholder={t('edit.placeholders.enjoyDoing')} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('edit.currentIntention')}
                                    </label>
                                    <Input {...register('currentIntention')} placeholder={t('edit.placeholders.currentIntention')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('edit.constraints')}
                                    </label>
                                    <Input {...register('constraints')} placeholder={t('edit.placeholders.constraints')} />
                                </div>
                            </div>

                            {/* Collaboration chips */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('edit.collaborationPreference')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {COLLAB_OPTIONS.map(opt => {
                                        const cur = selectedCollaborationPreferences;
                                        const label = t(`individual.collaborationStyles.${opt}` as never, opt);
                                        const isSelected = cur.includes(label);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    const next = isSelected
                                                        ? cur.filter(s => s !== label).join(', ')
                                                        : [...cur, label].join(', ');
                                                    setValue('collaborationPreference', next, { shouldDirty: true });
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${isSelected ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Intentions & Boundaries ── */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('edit.intentionsBoundaries')}</h3>
                            
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${seekingLocalEcoCommunity ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {seekingLocalEcoCommunity && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...register('seekingLocalEcoCommunity')}
                                    />
                                    <div className="text-sm text-gray-900 dark:text-white mt-0.5">
                                        {t('edit.intentions.seekingLocalEcoCommunity')}
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${seekingIntentionalCommunity ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {seekingIntentionalCommunity && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...register('seekingIntentionalCommunity')}
                                    />
                                    <div className="text-sm text-gray-900 dark:text-white mt-0.5">
                                        {t('edit.intentions.seekingIntentionalCommunity')}
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${highStakesProjectHelp ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {highStakesProjectHelp && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...register('highStakesProjectHelp')}
                                    />
                                    <div className="text-sm text-gray-900 dark:text-white mt-0.5">
                                        {t('edit.intentions.highStakesProjectHelp')}
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${strictNoRomance ? 'bg-rose-500 border-rose-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {strictNoRomance && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...register('strictNoRomance')}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t('edit.intentions.strictNoRomance')}
                                        </div>
                                        <div className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-semibold">
                                            {t('edit.intentions.strictNoRomanceWarning')}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* ── Archetypes ────────────────────────────────────── */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                                {t('edit.identitySection')}
                            </h3>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('individual.archetypes.title')} <span className="text-red-500">*</span> {t('edit.archetypesMax')}
                            </label>
                            <p className="text-xs text-gray-400 mb-3">
                                {t('edit.archetypeHelp')}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {BASE_ARCHETYPES.map((arch) => (
                                    <button
                                        key={arch.id}
                                        type="button"
                                        onClick={() => {
                                            const cur = getValues('archetypes') || [];
                                            let next: typeof cur;
                                            if (cur.includes(arch.id)) {
                                                next = cur.filter(id => id !== arch.id);
                                            } else if (cur.length < 3) {
                                                next = [...cur, arch.id];
                                            } else {
                                                next = cur;
                                            }
                                            setValue('archetypes', next, { shouldDirty: true });
                                        }}
                                        className={`p-3 rounded-lg border text-left transition-all text-sm flex items-center ${selectedArchetypes.includes(arch.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                                    >
                                        <span className="text-lg mr-2">{arch.icon}</span>
                                        <span>{t(`individual.archetypes.${arch.labelKey}` as never)}</span>
                                    </button>
                                ))}
                            </div>
                            {errors.archetypes && (
                                <p className="text-xs text-red-500 mt-1">{errors.archetypes.message as string}</p>
                            )}

                            {/* EXTRA archetypes — read-only, set by the quiz */}
                            {(() => {
                                const quizArchetypes = (user.archetypes || []).filter(
                                    (a: string) => !BASE_ARCHETYPE_IDS.has(a)
                                );
                                if (quizArchetypes.length === 0) return null;
                                return (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-400 mb-2">
                                            {t('edit.quizArchetypesReadonly')}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {quizArchetypes.map((a: string) => (
                                                <span key={a} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300">
                                                    {EXTRA_ARCHETYPE_ICONS[a] || '🔮'} {t(`individual.archetypes.${a.toLowerCase()}` as never, a)}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {t('edit.quizArchetypesHint')}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Social Causes ─────────────────────────────────── */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                                {t('edit.causesSection')}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('edit.mainCauses')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {causesList.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    const cur = getValues('mainCauses') || [];
                                                    if (cur.includes(c.id)) setValue('mainCauses', cur.filter(x => x !== c.id), { shouldDirty: true });
                                                    else if (cur.length < 3) setValue('mainCauses', [...cur, c.id], { shouldDirty: true });
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedMainCauses.includes(c.id) ? 'bg-rose-100 border-rose-500 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('edit.interestedCauses')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {causesList.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    const cur = getValues('interestedCauses') || [];
                                                    setValue('interestedCauses', cur.includes(c.id) ? cur.filter(x => x !== c.id) : [...cur, c.id], { shouldDirty: true });
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedInterestedCauses.includes(c.id) ? 'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Actions ───────────────────────────────────────── */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-950 p-4 -mx-4 -mb-6 mt-6">
                            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                                {t('common:actions.cancel')}
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isSubmitting} isLoading={isSubmitting}>
                                <SaveIcon className="h-4 w-4" />
                                {t('common:actions.save')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
