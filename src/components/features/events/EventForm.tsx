'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Alert, AlertDescription,
  ValidatedInput,
  Modal,
} from '@/components/ui';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { CityAutocompleteValue } from '@/components/ui/CityAutocomplete';
import { ValidationRule } from '@/hooks/useFieldValidation';
import {
CalendarIcon,
  UsersIcon,
  LinkIcon,
  SaveIcon,
  XIcon,
  TrashIcon,
    ImageIcon
} from 'lucide-react';
import { createEventAction, updateEventAction, deleteEventAction } from '@/app/actions/event';
import { getManageableCommunitiesAction } from '@/app/actions/community';
import { getCauses } from '@/app/actions/causes';
import { useAuth } from '@/components/providers';
import { useValidationErrors } from '@/hooks/useValidationErrors';

// Event schema
const eventSchema = z.object({
    title: z.string().min(3, 'Minimum 3 karakter').max(100),
    description: z.string().min(10, 'Minimum 10 karakter').max(2000),
    type: z.enum(['WORKSHOP', 'GATHERING', 'WORKDAY', 'CELEBRATION', 'TRAINING', 'OTHER']),
    startDate: z.string().min(1, 'Required'),
    startTime: z.string().min(1, 'Required'),
    endDate: z.string().optional(),
    endTime: z.string().optional(),
  location: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isOnline: z.boolean(),
    onlineLink: z.url().optional().or(z.literal('')),
    maxAttendees: z.preprocess(
        (value) => (typeof value === 'number' && Number.isNaN(value) ? undefined : value),
        z.number().int().positive().optional(),
    ),
    isPublic: z.boolean(),
    communityId: z.string().optional(),
    causeIds: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
    initialData?: Partial<EventFormData> & { id?: string };
    isEditMode?: boolean;
    onClose?: () => void; // Optional if used as modal
    currentUserId?: string;
}

export function EventForm({ initialData, isEditMode = false, onClose, currentUserId }: Readonly<EventFormProps>) {
  const { t } = useTranslation(['events', 'common', 'validation']);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manageableCommunities, setManageableCommunities] = useState<Array<{ id: string; name: string; city: string | null }>>([]);
  const [causeOptions, setCauseOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [cityValue, setCityValue] = useState<CityAutocompleteValue>(
    initialData?.location
      ? { name: initialData.location, country: '', lat: initialData.latitude || 0, lng: initialData.longitude || 0 }
      : null
  );
  const { setErrors, getFieldError } = useValidationErrors();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRelationOptions() {
      const [communitiesRes, causesRes] = await Promise.all([
        getManageableCommunitiesAction(),
        getCauses(),
      ]);
      if (cancelled) return;
      if (communitiesRes.success && communitiesRes.data) {
        setManageableCommunities(communitiesRes.data.map((community) => ({
          id: community.id,
          name: community.name,
          city: community.city,
        })));
      }
      if (causesRes.success && causesRes.data) {
        setCauseOptions(causesRes.data.slice(0, 80).map((cause) => ({ id: cause.id, title: cause.title })));
      }
    }
    void loadRelationOptions();
    return () => { cancelled = true; };
  }, []);

  const titleRules: ValidationRule[] = [
    { type: 'required', message: t('validation:required') },
    { type: 'minLength', value: 3, message: t('validation:minLength', { min: 3 }) },
  ];

  const onlineLinkRules: ValidationRule[] = [
    { type: 'url', message: t('validation:url') },
  ];

  const eventTypes = [
        { value: 'WORKSHOP', label: t('types.workshop'), icon: '🛠️' },
        { value: 'GATHERING', label: t('types.gathering'), icon: '🤝' },
        { value: 'WORKDAY', label: t('types.workday'), icon: '👷' },
        { value: 'CELEBRATION', label: t('types.celebration'), icon: '🎉' },
        { value: 'TRAINING', label: t('types.training'), icon: '📚' },
        { value: 'OTHER', label: t('types.other'), icon: '📌' },
    ];

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<EventFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(eventSchema) as any,
        defaultValues: {
            type: 'GATHERING',
            isOnline: false,
            isPublic: true,
            causeIds: [],
            ...initialData
        },
        mode: 'onTouched',
    });

    const isOnline = useWatch({ control, name: 'isOnline' });
    const coverImage = useWatch({ control, name: 'coverImage' });
    const selectedCauseIds = useWatch({ control, name: 'causeIds' }) ?? [];
    const eventCategoryMap: Record<EventFormData['type'], 'WORKSHOP' | 'MEETUP' | 'WORKDAY' | 'CELEBRATION' | 'TRAINING' | 'OTHER'> = {
        WORKSHOP: 'WORKSHOP',
        GATHERING: 'MEETUP',
        WORKDAY: 'WORKDAY',
        CELEBRATION: 'CELEBRATION',
        TRAINING: 'TRAINING',
        OTHER: 'OTHER',
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new globalThis.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Larger for cover
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setValue('coverImage', dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: EventFormData) => {
        const actorUserId = user?.id ?? currentUserId;
        if (!actorUserId) {
            setError(t('form.loginRequired'));
            return;
        }

        setIsSubmitting(true);
        setError(null);
        let shouldResetSubmitting = true;

        // Combine date and time
        const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
        const endDateTime = data.endDate && data.endTime ? new Date(`${data.endDate}T${data.endTime}`) : undefined;

        const payload = {
            ...data,
            category: eventCategoryMap[data.type],
            communityId: data.communityId?.trim() || undefined,
            causeIds: (data.causeIds ?? []).filter((causeId) => causeId.trim().length > 0),
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime?.toISOString(),
        };

        try {
            let result;
            if (isEditMode && initialData?.id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                result = await updateEventAction(actorUserId, initialData.id, payload as any);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                result = await createEventAction(actorUserId, payload as any);
            }

            if (result.success && result.data) {
                // Use a document navigation here. createEventAction/updateEventAction
                // revalidate the source /events route; under production standalone
                // that refresh can win over client router.push() and leave the user
                // on the list even though the mutation succeeded.
                if (onClose) onClose();
                shouldResetSubmitting = false;
                globalThis.location.assign(`/events/${result.data.id}`);
                return;
            } else {
                setErrors(result);
                setError(result.error || t('form.genericError'));
            }
        } catch {
            setError(t('form.commError'));
        } finally {
            if (shouldResetSubmitting) {
                setIsSubmitting(false);
            }
        }
    };

    const onInvalid = () => {
        setError(t('form.genericError'));
    };

    const handleDelete = async () => {
        const actorUserId = user?.id ?? currentUserId;
        if (!actorUserId || !initialData?.id) return;
        if (!confirm(t('form.deleteConfirm'))) return;

        setIsDeleting(true);
        let shouldResetDeleting = true;
        try {
            const result = await deleteEventAction(actorUserId, initialData.id);
            if (result.success) {
                shouldResetDeleting = false;
                globalThis.location.assign('/map');
                return;
            } else {
                setError(result.error || t('form.deleteFailed'));
            }
        } catch {
            setError(t('form.deleteCommError'));
        } finally {
            if (shouldResetDeleting) {
                setIsDeleting(false);
            }
        }
    };

    const formContent = (
            <Card className="w-full shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-emerald-600" />
                        {isEditMode ? t('form.editTitle') : t('form.createTitle')}
                    </CardTitle>
                    {onClose && (
                        <button
                            onClick={onClose}
                            aria-label={t('common:actions.close')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                    )}
                    {!onClose && isEditMode && (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            disabled={!isHydrated || isDeleting || isSubmitting}
                            data-testid="event-delete-button"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            {t('form.delete')}
                        </Button>

                    )}
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {getFieldError('title') && (
                        <p className="text-xs text-red-500 mb-2">{getFieldError('title')}</p>
                    )}

                    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                        {/* Cover Image */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.coverImage')}</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
                                {coverImage ? (
                                    <div className="relative h-48 w-full rounded-md overflow-hidden">
                                        <Image src={coverImage} alt="Cover" fill className="object-cover" unoptimized />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-2 right-2 bg-white/80 backdrop-blur"
                                            onClick={() => setValue('coverImage', '')}
                                        >
                                            {t('form.delete')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-8">
                                        <ImageIcon className="h-10 w-10 text-gray-400" />
                                        <div className="text-sm text-gray-500">
                                            {t('form.coverImageUpload')}
                                        </div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

{/* Title */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    {t('form.title')} *
  </label>
  <ValidatedInput
    {...register('title')}
    rules={titleRules}
    placeholder={t('form.titlePlaceholder')}
  />
  {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
</div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('form.type')} *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {eventTypes.map((type) => (
                                    <label
                                        key={type.value}
                                        className="cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            {...register('type')}
                                            value={type.value}
                                            className="sr-only peer"
                                        />
                                        <div className="p-3 border rounded-lg text-center transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-900/20 hover:border-gray-300">
                                            <span className="text-xl">{type.icon}</span>
                                            <p className="text-xs mt-1">{type.label}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {manageableCommunities.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.community')}
                                </label>
                                <select
                                    {...register('communityId')}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <option value="">{t('form.noCommunity')}</option>
                                    {manageableCommunities.map((community) => (
                                        <option key={community.id} value={community.id}>
                                            {community.name + (community.city ? ' - ' + community.city : '')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {causeOptions.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.causes')}
                                </label>
                                <select
                                    multiple
                                    value={selectedCauseIds}
                                    onChange={(event) => {
                                        const values = Array.from(event.currentTarget.selectedOptions, (option) => option.value);
                                        setValue('causeIds', values, { shouldDirty: true });
                                    }}
                                    className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                >
                                    {causeOptions.map((cause) => (
                                        <option key={cause.id} value={cause.id}>{cause.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('form.description')} *
                            </label>
                            <Textarea
                                {...register('description')}
                                rows={4}
                                placeholder={t('form.descriptionPlaceholder')}
                                className="resize-none"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.dates.start')} *
                                </label>
                                <Input
                                    type="date"
                                    {...register('startDate')}
                                />
                                {errors.startDate && <p className="text-destructive text-sm mt-1">{errors.startDate.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.dates.startTime')} *
                                </label>
                                <Input
                                    type="time"
                                    {...register('startTime')}
                                />
                                {errors.startTime && <p className="text-destructive text-sm mt-1">{errors.startTime.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.dates.end')}
                                </label>
                                <Input
                                    type="date"
                                    {...register('endDate')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.dates.endTime')}
                                </label>
                                <Input
                                    type="time"
                                    {...register('endTime')}
                                />
                            </div>
                        </div>

                        {/* Online toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                {...register('isOnline')}
                                id="isOnline"
                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="isOnline" className="text-sm text-gray-700 dark:text-gray-300">
                                {t('form.isOnline')}
                            </label>
                        </div>

{/* Location or Online Link */}
{isOnline ? (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {t('form.onlineLink')}
    </label>
    <div className="relative">
      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
      <ValidatedInput
        {...register('onlineLink')}
        rules={onlineLinkRules}
        className="pl-10"
        placeholder={t('form.onlineLinkPlaceholder')}
      />
    </div>
  </div>
) : (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {t('form.location')}
    </label>
    <CityAutocomplete
      value={cityValue}
      onChange={(val) => {
        setCityValue(val);
        setValue('location', val?.name || '', { shouldDirty: true });
        setValue('latitude', val?.lat, { shouldDirty: true });
        setValue('longitude', val?.lng, { shouldDirty: true });
      }}
      placeholder={t('form.locationPlaceholder')}
    />
  </div>
)}

                        {/* Max Attendees */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('form.maxAttendees')}
                            </label>
                            <div className="relative">
                                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="number"
                                    {...register('maxAttendees', {
                                        setValueAs: (value) => {
                                            if (value === '' || value === null || value === undefined) return undefined;
                                            const parsed = Number(value);
                                            return Number.isNaN(parsed) ? undefined : parsed;
                                        },
                                    })}
                                    className="pl-10"
                                    placeholder={t('form.maxAttendeesPlaceholder')}
                                />
                            </div>
                        </div>

                        {/* Public toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                {...register('isPublic')}
                                id="isPublic"
                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                                {t('form.isPublic')}
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {onClose && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    {t('common:actions.cancel')}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={!isHydrated || isSubmitting}
                                data-testid="event-submit-button"
                            >
                                <SaveIcon className="h-4 w-4 mr-2" />
                                {isEditMode ? t('form.save') : t('form.submit')}
                            </Button>

                        </div>
                    </form>
                </CardContent>
            </Card>
    );

    if (onClose) {
        return (
            <Modal
                isOpen
                onClose={onClose}
                ariaLabel={isEditMode ? t('form.editTitle') : t('form.createTitle')}
                data-testid="event-form-modal"
                overlayClassName="overflow-y-auto"
                className="max-w-2xl my-8"
                closeOnBackdropClick={false}
            >
                <div className="w-full">{formContent}</div>
            </Modal>
        );
    }

    return <div data-testid="event-form-standalone" className="max-w-3xl mx-auto">{formContent}</div>;
}
