'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, TrashIcon, ImageIcon, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Checkbox,
  Label,
  Alert, AlertDescription,
  Badge,
  ValidatedInput,
} from '@/components/ui';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { CityAutocompleteValue } from '@/components/ui/CityAutocomplete';
import type { ValidationRule } from '@/hooks/useFieldValidation';
import { createCommunityAction, updateCommunityAction, deleteCommunityAction } from '@/app/actions/community';
import { useAuth } from '@/components/providers';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { CommonsLicenseNotice } from '@/components/shared/CommonsLicenseNotice';

// Re-defining schema here for client-side validation logic matching the server
const createCommunitySchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().max(5000).optional(),
    type: z.enum([
        'NATURE_CONNECTED_ECO_HUB', 'HEALING_SANCTUARY', 'INCLUSIVE_SUPPORT_NETWORK',
        'CREATIVE_ARTS_COLONY', 'EGALITARIAN_LIVING', 'SPIRITUAL_HAVEN',
        'KNOWLEDGE_HUB', 'NOMADIC_NETWORK', 'REGENERATIVE_ECONOMIC',
        'VISIONARY_MODEL_CITY', 'EARTH_REGENERATION_CENTER', 'FRONTLINE_ACTIVIST'
    ], { message: 'Please select a type' }),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  foundingYear: z.preprocess(
        (value) => value === '' || value == null ? undefined : value,
        z.coerce.number().min(1900, 'Valid year required').max(new Date().getFullYear(), 'Cannot be a future date').optional()
    ),
    website: z.url('Please enter a valid URL').optional().or(z.literal('')),
    contactEmail: z.email('Please enter a valid email address').optional().or(z.literal('')),
    contactPhone: z.string().optional(),

    // Values
    values: z.array(z.string()).optional(),

    // Membership
    acceptingNewMembers: z.boolean().default(true),
    targetMemberDescription: z.string().optional(),
    membershipCost: z.string().optional(),
    joiningProcess: z.string().optional(),

    // Volunteers
    seekingVolunteers: z.boolean().default(false),
    volunteerDescription: z.string().optional(),
    volunteerCapabilities: z.array(z.string()).optional(),

    // Optional deep info
    vision: z.string().optional(),
    principles: z.string().optional(),
    houseRules: z.string().optional(),
    annualGoals: z.string().optional(),

    coverImage: z.string().optional(),
});

type FormData = z.infer<typeof createCommunitySchema>;

const COMMUNITY_TYPE_KEYS = [
    'NATURE_CONNECTED_ECO_HUB', 'HEALING_SANCTUARY', 'INCLUSIVE_SUPPORT_NETWORK',
    'CREATIVE_ARTS_COLONY', 'EGALITARIAN_LIVING', 'SPIRITUAL_HAVEN',
    'KNOWLEDGE_HUB', 'NOMADIC_NETWORK', 'REGENERATIVE_ECONOMIC',
    'VISIONARY_MODEL_CITY', 'EARTH_REGENERATION_CENTER', 'FRONTLINE_ACTIVIST'
];

interface TagInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    label: string;
}

const TagInput = ({ values = [], onChange, placeholder, label }: TagInputProps) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !values.includes(trimmed)) {
            onChange([...values, trimmed]);
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(values.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
                {values.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <div className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1"
                />
                <Button type="button" onClick={addTag} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

interface CommunityFormProps {
    initialData?: Partial<FormData> & { id?: string, values?: string[], volunteerCapabilities?: string[] };
    isEditMode?: boolean;
}

export function CommunityForm({ initialData, isEditMode = false }: Readonly<CommunityFormProps>) {
  const { t } = useTranslation(['profiles', 'common', 'validation']);
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setErrors, getFieldError } = useValidationErrors();
  const [isDeleting, setIsDeleting] = useState(false);
  const [cityValue, setCityValue] = useState<CityAutocompleteValue>(
    initialData?.city
      ? { name: initialData.city, country: initialData.country || '', lat: initialData.latitude || 0, lng: initialData.longitude || 0 }
      : null
  );

  const websiteRules: ValidationRule[] = [
    { type: 'url', message: t('validation:url') },
  ];

  const emailRules: ValidationRule[] = [
    { type: 'email', message: t('validation:email') },
  ];

  // Ensure array fields are initialized correctly from initialData
    const defaultValues: Partial<FormData> = {
        acceptingNewMembers: true,
        seekingVolunteers: false,
        values: [],
        volunteerCapabilities: [],
        type: undefined,
        ...initialData,
    };

    const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createCommunitySchema) as any,
        defaultValues,
        mode: 'onTouched',
    });

    const coverImage = useWatch({ control, name: 'coverImage' });
    const acceptingNewMembers = useWatch({ control, name: 'acceptingNewMembers' });
    const seekingVolunteers = useWatch({ control, name: 'seekingVolunteers' });
    const currentValues = useWatch({ control, name: 'values' }) || [];
    const currentCapabilities = useWatch({ control, name: 'volunteerCapabilities' }) || [];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new globalThis.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; // Increased for cover
                const MAX_HEIGHT = 600;
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
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setValue('coverImage', dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: FormData) => {
        if (!user) {
            setError(t('community.form.loginRequired'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let result;
            if (isEditMode && initialData?.id) {
                result = await updateCommunityAction(user.id, initialData.id, data);
            } else {
                result = await createCommunityAction(user.id, data);
            }

            if (result.success && result.data) {
                const destination = `/communities/${result.data.id}`;
                router.push(destination);
                globalThis.location.assign(destination);
            } else {
                setErrors(result);
                setError(result.error || t('community.form.genericError'));
            }
        } catch {
            setError(t('community.form.commError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !initialData?.id) return;
        if (!confirm(t('community.form.deleteConfirm'))) return;

        setIsDeleting(true);
        try {
            const result = await deleteCommunityAction(user.id, initialData.id);
            if (result.success) {
                router.push('/map');
            } else {
                setError(result.error || t('community.form.deleteFailed'));
            }
        } catch {
            setError(t('community.form.deleteCommError'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto p-6 bg-card rounded-xl shadow-sm border">
            <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 border-b pb-4">
                <h1 className="text-2xl font-bold">
                    {isEditMode ? t('community.form.editTitle') : t('community.form.createTitle')}
                </h1>
                {isEditMode && (
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting || isSubmitting}
                    >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        {t('community.form.delete')}
                    </Button>
                )}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <CommonsLicenseNotice />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Essential Info */}
                <div className="space-y-6">
<div className="space-y-2">
  <Label htmlFor="name">{t('community.form.nameLabel')} *</Label>
  <Input
    id="name"
    {...register('name')}
    placeholder={t('community.form.namePlaceholder')}
  />
  {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
  {getFieldError('name') && <p className="text-destructive text-sm">{getFieldError('name')}</p>}
</div>

                    <div className="space-y-2">
                        <Label htmlFor="type">{t('community.form.typeLabel')} *</Label>
                        <Select
                            id="type"
                            {...register('type')}
                            defaultValue={defaultValues.type ?? ''}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('community.form.typePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMUNITY_TYPE_KEYS.map((key) => (
                                    <SelectItem key={key} value={key}>{t(`community.form.types.${key}`)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="foundingYear">{t('community.form.foundingYearLabel')}</Label>
                        <Input
                            id="foundingYear"
                            type="number"
                            {...register('foundingYear')}
                            placeholder={t('community.form.foundingYearPlaceholder')}
                        />
                        {errors.foundingYear && <p className="text-destructive text-sm">{errors.foundingYear.message}</p>}
                    </div>

<div className="space-y-2">
        <Label>{t('community.form.cityLabel')}</Label>
        <CityAutocomplete
          value={cityValue}
          onChange={(val) => {
            setCityValue(val);
            setValue('city', val?.name || '', { shouldDirty: true });
            setValue('country', val?.country || '', { shouldDirty: true });
            setValue('latitude', val?.lat, { shouldDirty: true });
            setValue('longitude', val?.lng, { shouldDirty: true });
          }}
          placeholder={t('community.form.countryPlaceholder')}
        />
      </div>

<div className="space-y-2">
  <Label htmlFor="website">{t('community.form.websiteLabel')}</Label>
  <ValidatedInput
    id="website"
    {...register('website')}
    defaultValue={defaultValues.website}
    rules={websiteRules}
    placeholder="https://..."
  />
  {errors.website && <p className="text-destructive text-sm">{errors.website.message}</p>}
</div>

<div className="space-y-2">
  <Label>{t('community.form.contactLabel')}</Label>
  <div className="grid grid-cols-1 gap-4">
    <ValidatedInput
      {...register('contactEmail')}
      defaultValue={defaultValues.contactEmail}
      rules={emailRules}
      placeholder={t('community.form.contactEmailPlaceholder')}
      type="email"
    />
    {errors.contactEmail && <p className="text-destructive text-sm">{errors.contactEmail.message}</p>}
    <Input {...register('contactPhone')} placeholder={t('community.form.contactPhonePlaceholder')} type="tel" />
  </div>
</div>

                    <TagInput
                        label={t('community.form.valuesLabel')}
                        placeholder={t('community.form.valuesPlaceholder')}
                        values={currentValues}
                        onChange={(vals) => setValue('values', vals)}
                    />
                </div>

                {/* Right Column: Descriptions & Details */}
                <div className="space-y-6">
                    {/* Cover Image Upload - Moved here for better layout balance */}
                    <div className="space-y-2">
                        <Label>{t('community.form.coverImageLabel')}</Label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
                            {coverImage ? (
                                <div className="relative h-48 w-full rounded-md overflow-hidden">
                                    <Image src={coverImage} alt="Cover" fill className="object-cover" unoptimized />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => setValue('coverImage', '')}
                                    >
                                        {t('community.form.delete')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-8">
                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                    <div className="text-sm text-gray-500">
                                        {t('community.form.coverImageUpload')}
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

                    <div className="space-y-2">
                        <Label htmlFor="description">{t('community.form.descriptionLabel')}</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder={t('community.form.descriptionPlaceholder')}
                            className="min-h-[120px]"
                        />
                        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
                    </div>

                    {/* Membership Section */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="acceptingNewMembers"
                                checked={!!acceptingNewMembers}
                                onCheckedChange={(checked) => setValue('acceptingNewMembers', checked)}
                            />
                            <Label htmlFor="acceptingNewMembers" className="font-semibold cursor-pointer">
                                {t('community.form.acceptingMembersLabel')}
                            </Label>
                        </div>

                        {acceptingNewMembers && (
                            <div className="pl-6 space-y-4 border-l-2 ml-1 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>{t('community.form.targetMemberLabel')}</Label>
                                    <Textarea {...register('targetMemberDescription')} placeholder={t('community.form.targetMemberPlaceholder')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('community.form.membershipCostLabel')}</Label>
                                    <Input {...register('membershipCost')} placeholder={t('community.form.membershipCostPlaceholder')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('community.form.joiningProcessLabel')}</Label>
                                    <Textarea {...register('joiningProcess')} placeholder={t('community.form.joiningProcessPlaceholder')} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Volunteer Section */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="seekingVolunteers"
                                checked={!!seekingVolunteers}
                                onCheckedChange={(checked) => setValue('seekingVolunteers', checked)}
                            />
                            <Label htmlFor="seekingVolunteers" className="font-semibold cursor-pointer">
                                {t('community.form.seekingVolunteersLabel')}
                            </Label>
                        </div>

                        {seekingVolunteers && (
                            <div className="pl-6 space-y-4 border-l-2 ml-1 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>{t('community.form.volunteerDescLabel')}</Label>
                                    <Textarea {...register('volunteerDescription')} placeholder={t('community.form.volunteerDescPlaceholder')} />
                                </div>
                                <TagInput
                                    label={t('community.form.volunteerCapabilitiesLabel')}
                                    placeholder={t('community.form.volunteerCapabilitiesPlaceholder')}
                                    values={currentCapabilities}
                                    onChange={(vals) => setValue('volunteerCapabilities', vals)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Width Sections: Deep Info (Optional) */}
            <div className="space-y-6 pt-6 border-t">
                <h3 className="text-lg font-semibold">{t('community.form.detailsSectionTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>{t('community.form.visionLabel')}</Label>
                        <Textarea {...register('vision')} placeholder={t('community.form.visionPlaceholder')} className="min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('community.form.principlesLabel')}</Label>
                        <Textarea {...register('principles')} placeholder={t('community.form.principlesPlaceholder')} className="min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('community.form.houseRulesLabel')}</Label>
                        <Textarea {...register('houseRules')} placeholder={t('community.form.houseRulesPlaceholder')} className="min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('community.form.annualGoalsLabel')}</Label>
                        <Textarea {...register('annualGoals')} placeholder={t('community.form.annualGoalsPlaceholder')} className="min-h-[100px]" />
                    </div>
                </div>
            </div>

            <div className="pt-6 flex gap-4 justify-end border-t mt-8">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    {t('common:actions.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting} size="lg">
                    {(() => {
                        if (isSubmitting) return (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditMode ? t('community.form.saving') : t('community.form.creating')}
                            </>
                        );
                        return isEditMode ? t('community.form.saveChanges') : t('community.form.createCommunity');
                    })()}
                </Button>
            </div>
        </form>
    );
}
