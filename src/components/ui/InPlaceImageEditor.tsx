'use client';

import React, { useRef, useState } from 'react';
import { PencilIcon, Loader2Icon, ImageIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface InPlaceImageEditorProps {
    currentImage?: string | null;
    onUpload: (base64: string) => Promise<void>;
    type: 'profile' | 'cover';
    isEditable?: boolean;
    className?: string;
    alt?: string;
}

export function InPlaceImageEditor({
    currentImage,
    onUpload,
    type,
    isEditable = false,
    className,
    alt = ''
}: Readonly<InPlaceImageEditorProps>) {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new globalThis.Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');

                // Dimensions based on type
                const MAX_WIDTH = type === 'profile' ? 400 : 1200;
                const MAX_HEIGHT = type === 'profile' ? 400 : 600;

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

                const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

                try {
                    await onUpload(dataUrl);
                } catch (error) {
                    console.error('Image upload failed:', error);
                } finally {
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const isProfile = type === 'profile';

    return (
        <div className={cn(
            "relative group overflow-hidden",
            isProfile ? "rounded-full" : "rounded-2xl",
            className
        )}>
            {/* Image display */}
            {currentImage ? (
                <Image
                    src={currentImage}
                    alt={alt || ""}
                    fill
                    className="object-cover"
                    unoptimized
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                    {isProfile ? (
                        <UserIcon className="w-1/2 h-1/2" />
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <ImageIcon className="w-12 h-12" />
                            {isEditable && <span className="text-xs">{t('imageEditor.uploadCover')}</span>}
                        </div>
                    )}
                </div>
            )}

            {/* Loading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 backdrop-blur-[2px]">
                    <Loader2Icon className="w-8 h-8 text-white animate-spin" />
                </div>
            )}

            {/* Edit Button */}
            {isEditable && !isUploading && (
                <button type="button" className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-within:bg-black/20 transition-all flex items-center justify-center z-10 cursor-pointer" onClick={triggerFileSelect} aria-label={t('imageEditor.changeImage')}>
                    <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 active:scale-95 duration-200">
                        <PencilIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                </button>
            )}

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}
