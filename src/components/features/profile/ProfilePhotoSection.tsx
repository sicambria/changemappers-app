'use client';

import Image from 'next/image';
import { UseFormSetValue } from 'react-hook-form';
import { ImageIcon, UserIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfilePhotoSectionProps {
    profilePhoto: string | undefined;
    coverImage: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: UseFormSetValue<any>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfilePhotoSection({ profilePhoto, coverImage, setValue }: Readonly<ProfilePhotoSectionProps>) {
    const { t } = useTranslation('profiles');
    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldName: 'profilePhoto' | 'coverImage',
        maxW: number,
        maxH: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new globalThis.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const ratio = Math.min(maxW / w, maxH / h, 1);
                w = Math.round(w * ratio); h = Math.round(h * ratio);
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
                setValue(fieldName, canvas.toDataURL('image/jpeg', 0.82), { shouldDirty: true });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            {/* ── Cover Image ───────────────────────────────────── */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('edit.coverImageLabel')}
                </label>
                <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group">
                    {coverImage ? (
                        <Image src={coverImage} alt="Cover" fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 dark:from-gray-700 dark:via-emerald-900/20 dark:to-gray-700 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                    <label className="absolute bottom-2 right-2 p-2 bg-emerald-600 text-white rounded-full cursor-pointer shadow-md hover:bg-emerald-700 transition-colors" aria-label={t('edit.changeImageAria')}>
                        <ImageIcon className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'coverImage', 1200, 600)} />
                    </label>
                    {coverImage && (
                        <button
                            type="button"
                            onClick={() => setValue('coverImage', '', { shouldDirty: true })}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            aria-label={t('edit.removeCoverImageAria')}
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-400">{t('edit.coverImageHint')}</p>
            </div>

            {/* ── Profile Photo ─────────────────────────────────── */}
            <div className="flex justify-center mb-6">
                <div className="relative group">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 dark:bg-gray-800">
                        {profilePhoto ? (
                            <Image src={profilePhoto} alt="Profile" fill className="object-cover" unoptimized />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <UserIcon className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full cursor-pointer shadow-md hover:bg-emerald-700 transition-colors">
                        <ImageIcon className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'profilePhoto', 400, 400)} />
                    </label>
                </div>
            </div>
        </>
    );
}
