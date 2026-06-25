'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, ImageIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { saveLeanProfileTrustAction } from '@/app/actions/lean-register';

type SocialKey = 'linkedin' | 'github' | 'mastodon';

interface Props {
  userId: string;
  onSuccess: () => void;
}

const SOCIAL_KEYS: SocialKey[] = ['linkedin', 'github', 'mastodon'];
const MAX_BIO_LENGTH = 500;
const MIN_BIO_LENGTH = 20;

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

async function resizeImageFile(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(400 / img.width, 400 / img.height, 1);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('decode-failed'));
    img.src = dataUrl;
  });
}

export default function StepProfileTrust({ userId, onSuccess }: Readonly<Props>) {
  const { t } = useTranslation(['auth']);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [bio, setBio] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({ linkedin: '', github: '', mastodon: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasContextSignal = useMemo(
    () => Boolean(organizationName.trim()) || Boolean(website.trim()) || Object.values(socialLinks).some((value) => value.trim().length > 0),
    [organizationName, socialLinks, website],
  );
  const urlsAreValid = isValidUrl(website) && Object.values(socialLinks).every(isValidUrl);
  const canSubmit = Boolean(profilePhoto)
    && bio.trim().length >= MIN_BIO_LENGTH
    && bio.trim().length <= MAX_BIO_LENGTH
    && hasContextSignal
    && urlsAreValid;

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsProcessingImage(true);
    try {
      setProfilePhoto(await resizeImageFile(file));
    } catch {
      setError(t('onboarding.lean.step4.validation.photo'));
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!profilePhoto) {
      setError(t('onboarding.lean.step4.validation.photo'));
      return;
    }
    if (bio.trim().length < MIN_BIO_LENGTH || bio.trim().length > MAX_BIO_LENGTH) {
      setError(t('onboarding.lean.step4.validation.bio'));
      return;
    }
    if (!hasContextSignal) {
      setError(t('onboarding.lean.step4.validation.context'));
      return;
    }
    if (!urlsAreValid) {
      setError(t('onboarding.lean.step4.validation.url'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await saveLeanProfileTrustAction(userId, {
      profilePhoto,
      bio: bio.trim(),
      organizationName: organizationName.trim() || undefined,
      organizationDescription: organizationDescription.trim() || undefined,
      website: website.trim() || undefined,
      socialLinks,
    });
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="space-y-6" data-testid="lean-profile-trust">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <ShieldCheckIcon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('onboarding.lean.step4.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('onboarding.lean.step4.subtitle')}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex justify-center">
          <div className="relative">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              {profilePhoto ? (
                <Image src={profilePhoto} alt={t('onboarding.lean.step4.photoAlt')} fill className="object-cover" unoptimized />
              ) : (
                <UserIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-emerald-600 p-2 text-white shadow-md hover:bg-emerald-700" aria-label={t('onboarding.lean.step4.photoLabel')}>
              <ImageIcon className="h-4 w-4" />
              <input data-testid="lean-trust-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          {isProcessingImage ? t('onboarding.lean.step4.photoProcessing') : t('onboarding.lean.step4.photoHelp')}
        </p>
      </section>

      <section className="space-y-2 border-t border-gray-100 pt-5 dark:border-gray-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="lean-trust-bio">
          {t('onboarding.lean.step4.bioLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="lean-trust-bio"
          data-testid="lean-trust-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={MAX_BIO_LENGTH}
          rows={5}
          placeholder={t('onboarding.lean.step4.bioPlaceholder')}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <p className="text-xs text-gray-500">{bio.trim().length}/{MAX_BIO_LENGTH}</p>
      </section>

      <section className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          {t('onboarding.lean.step4.contextTitle')} <span className="text-red-500">*</span>
        </h3>
        <Input data-testid="lean-trust-organization-name" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={t('onboarding.lean.step4.organizationNamePlaceholder')} />
        <Input data-testid="lean-trust-website" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder={t('onboarding.lean.step4.websitePlaceholder')} />
        <textarea
          data-testid="lean-trust-organization-description"
          value={organizationDescription}
          onChange={(event) => setOrganizationDescription(event.target.value)}
          maxLength={MAX_BIO_LENGTH}
          rows={3}
          placeholder={t('onboarding.lean.step4.organizationDescriptionPlaceholder')}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="grid grid-cols-1 gap-2">
          {SOCIAL_KEYS.map((key) => (
            <Input
              key={key}
              data-testid={`lean-trust-social-${key}`}
              value={socialLinks[key]}
              onChange={(event) => setSocialLinks((prev) => ({ ...prev, [key]: event.target.value }))}
              placeholder={t(`onboarding.lean.step4.social.${key}`)}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.lean.step4.contextHelp')}</p>
      </section>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <Button onClick={handleSubmit} isLoading={isSubmitting || isProcessingImage} disabled={!canSubmit} data-testid="lean-trust-submit" className="w-full" size="lg">
        {t('onboarding.lean.step4.submitButton')}
        <ArrowRightIcon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
