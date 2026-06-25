'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, CommunityCombobox, ValidatedInput, CityAutocomplete } from '@/components/ui';
import { ValidationRule } from '@/hooks/useFieldValidation';
import { CommunityOption } from '@/components/ui/CommunityCombobox';
import { savePresenceAction } from '@/app/actions/onboarding';
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';

interface Props {
    userId: string;
    cmapLevel: number;
    onSuccess: () => void;
    onBack: () => void;
    onSkip: () => void;
}

type LocationPrecisionChoice = 'COUNTRY' | 'CITY' | 'EXACT';

interface PresenceState {
    motto: string;
    bio: string;
    city: string;
    country: string;
    website: string;
    isRemoteCapable: boolean;
    organizationName: string;
    organizationDescription: string;
    workingSectors: string[];
    profilePhoto: string;
    selectedCommunity: CommunityOption | null;
    cityCoords: { lat: number; lng: number } | null;
    locationPrecision: LocationPrecisionChoice;
}

const locationPrecisionChoices: LocationPrecisionChoice[] = ['COUNTRY', 'CITY', 'EXACT'];

function processImageForUpload(
    img: HTMLImageElement,
    setPresence: React.Dispatch<React.SetStateAction<PresenceState>>,
): void {
    const canvas = document.createElement('canvas');
    const MAX = 400;
    let [w, h] = [img.width, img.height];
    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
    else if (h > MAX) { w *= MAX / h; h = MAX; }
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(img, 0, 0, w, h);
    setPresence(prev => ({ ...prev, profilePhoto: canvas.toDataURL('image/jpeg', 0.8) }));
}

export default function Stage3Presence({ userId, cmapLevel, onSuccess, onBack, onSkip: _onSkip }: Readonly<Props>) {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCityNudge, setShowCityNudge] = useState(false);

  const mottoRules: ValidationRule[] = [
    { type: 'minLength', value: 5, message: t('onboarding.errors.mottoMin') },
    { type: 'maxLength', value: 140, message: t('validation:maxLength', { max: 140 }) },
  ];

  const [presence, setPresence] = useState<PresenceState>({
    motto: '',
    bio: '',
    city: '',
    country: 'Hungary',
    website: '',
    isRemoteCapable: false,
    organizationName: '',
    organizationDescription: '',
    workingSectors: [],
    profilePhoto: '',
    selectedCommunity: null,
    cityCoords: null,
    locationPrecision: 'COUNTRY',
  });

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new globalThis.Image();
            img.onload = () => processImageForUpload(img, setPresence);
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const validatePresenceForm = (): string | null => {
        if (presence.motto.length < 5) return t('onboarding.errors.mottoMin');
        if (presence.bio.length < 10) return t('onboarding.errors.bioMin');
        if (!presence.country) return t('onboarding.errors.countryRequired');
        if ((presence.locationPrecision === 'CITY' || presence.locationPrecision === 'EXACT') && !presence.cityCoords) {
            return t(presence.locationPrecision === 'CITY'
                ? 'onboarding.stage3.locationPrecision.cityRequired'
                : 'onboarding.stage3.locationPrecision.exactRequired');
        }
        return null;
    };

    const handleStage3 = async () => {
        setIsSubmitting(true);
        setError(null);

        const validationError = validatePresenceForm();
        if (validationError) {
            setError(validationError);
            setIsSubmitting(false);
            return;
        }

        if (presence.locationPrecision !== 'COUNTRY' && !presence.city && !showCityNudge) {
            setShowCityNudge(true);
            setIsSubmitting(false);
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      tagline: presence.motto,
      bio: presence.bio,
      city: presence.city || undefined,
      country: presence.country || undefined,
      website: presence.website || undefined,
      isRemoteCapable: presence.isRemoteCapable,
      latitude: presence.cityCoords?.lat,
      longitude: presence.cityCoords?.lng,
      locationPrecision: presence.locationPrecision,
      profilePhoto: presence.profilePhoto || undefined,
      organizationName: presence.organizationName || undefined,
      organizationDescription: presence.organizationDescription || undefined,
    };

            if (presence.selectedCommunity) {
                if (presence.selectedCommunity.isNew) {
                    payload.newCommunityName = presence.selectedCommunity.name;
                } else {
                    payload.communityId = presence.selectedCommunity.id;
                }
            }

            const res = await savePresenceAction(payload, userId);

            if (res.success) {
                onSuccess();
            } else {
                setError(res.error || t('onboarding.errors.saveFailed'));
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage3.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage3.subtitle')}</p>
            </div>

            {/* Photo */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {presence.profilePhoto
                        ? <Image src={presence.profilePhoto} alt="Profile" fill className="object-cover" unoptimized />
                        : <UserIcon className="h-8 w-8 text-gray-400" />}
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload}
                    className="text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            </div>

  {/* Motto */}
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {t('onboarding.stage3.mottoLabel')} <span className="text-red-500">*</span>
    </label>
    <div className="text-xs text-gray-400 mb-1">{t('onboarding.stage3.mottoHint')}</div>
    <ValidatedInput
      data-testid="onboarding-stage3-motto"
      value={presence.motto}
      onChange={(e) => setPresence(p => ({ ...p, motto: e.target.value.substring(0, 140) }))}
      rules={mottoRules}
      placeholder={t('onboarding.stage3.mottoPlaceholder')}
    />
  </div>

            {/* Bio */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage3.bioLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="text-xs text-gray-400 mb-2">{t('onboarding.stage3.bioHint')}</div>
                <textarea
                    data-testid="onboarding-stage3-bio"
                    value={presence.bio}
                    onChange={(e) => setPresence(p => ({ ...p, bio: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
                    rows={4}
                    placeholder={t('onboarding.stage3.bioPlaceholder')}
                />
                <div className="text-right text-xs text-gray-400">{t('onboarding.stage3.charsRemaining', { count: presence.bio.length })}</div>
            </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <CityAutocomplete
value={presence.cityCoords ? { name: presence.city, country: '', lat: presence.cityCoords.lat, lng: presence.cityCoords.lng } : null}
          onChange={(val) => {
            setPresence(p => ({
              ...p,
              city: val?.name || '',
              cityCoords: val ? { lat: val.lat, lng: val.lng } : null
            }));
              setShowCityNudge(false);
            }}
            placeholder={t('onboarding.stage3.cityPlaceholder')}
          />
          {showCityNudge && (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
              <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-tight">
                {t('onboarding.stage3.cityNudge')}
              </p>
              <button
                type="button"
                data-testid="onboarding-stage3-city-skip"
                onClick={() => handleStage3()}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline mt-1 block"
              >
                {t('onboarding.stage3.citySkip')}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="relative">
            <Input 
              value={presence.country} 
              onChange={(e) => setPresence(p => ({ ...p, country: e.target.value }))}
              placeholder={t('onboarding.stage3.countryPlaceholder')} 
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">*</span>
          </div>
        </div>
      </div>

      <div className="space-y-2" data-testid="onboarding-stage3-location-precision">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <MapPinIcon className="h-4 w-4 text-emerald-600" />
          {t('onboarding.stage3.locationPrecision.label')}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {locationPrecisionChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              data-testid={`onboarding-stage3-location-precision-${choice.toLowerCase()}`}
              onClick={() => setPresence(p => ({ ...p, locationPrecision: choice }))}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${presence.locationPrecision === choice
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
              aria-pressed={presence.locationPrecision === choice}
            >
              <span className="block font-semibold">{t(`onboarding.stage3.locationPrecision.${choice.toLowerCase()}.label`)}</span>
              <span className="mt-1 block leading-snug">{t(`onboarding.stage3.locationPrecision.${choice.toLowerCase()}.example`)}</span>
            </button>
          ))}
        </div>
      </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={presence.isRemoteCapable}
                    onChange={(e) => setPresence(p => ({ ...p, isRemoteCapable: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300" />
                {t('onboarding.stage3.remoteCapable')}
            </label>

            {/* Community Selection */}
            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage3.communityLabel')}
                    <span className="text-xs text-gray-400 ml-1">{t('onboarding.stage3.communityOptional')}</span>
                </label>
                <div className="text-xs text-gray-400 mb-2">{t('onboarding.stage3.communityHint')}</div>
                <CommunityCombobox
                    value={presence.selectedCommunity}
                    onChange={(val) => setPresence(p => ({ ...p, selectedCommunity: val }))}
                    placeholder={t('onboarding.stage3.communityPlaceholder')}
                />
            </div>

            {cmapLevel >= 5 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <h3 className="text-sm font-semibold text-emerald-600">{t('onboarding.stage3.orgTitle')}</h3>
                    <Input value={presence.organizationName} data-testid="onboarding-stage3-org-name" onChange={(e) => setPresence(p => ({ ...p, organizationName: e.target.value }))}
                        placeholder={t('onboarding.stage3.orgNamePlaceholder')} />
                    <textarea
                        data-testid="onboarding-stage3-org-description"
                        value={presence.organizationDescription}
                        onChange={(e) => setPresence(p => ({ ...p, organizationDescription: e.target.value.substring(0, 300) }))}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
                        rows={3}
                        placeholder={t('onboarding.stage3.orgDescPlaceholder')}
                    />
                </div>
            )}

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            <div className="flex gap-3 mt-8">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage3.backButton')}
                </Button>
                <Button onClick={handleStage3} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage3-submit">
                    {t('onboarding.stage3.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
