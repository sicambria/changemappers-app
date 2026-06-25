'use client';

import { UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOCIAL_LINK_FIELDS = [
    { key: 'linkedin',  label: 'LinkedIn',    placeholder: 'https://linkedin.com/in/...' },
    { key: 'twitter',   label: 'Twitter / X', placeholder: 'https://x.com/...' },
    { key: 'facebook',  label: 'Facebook',    placeholder: 'https://facebook.com/...' },
    { key: 'instagram', label: 'Instagram',   placeholder: 'https://instagram.com/...' },
    { key: 'youtube',   label: 'YouTube',     placeholder: 'https://youtube.com/@...' },
    { key: 'github',    label: 'GitHub',      placeholder: 'https://github.com/...' },
    { key: 'mastodon',  label: 'Mastodon',    placeholder: 'https://mastodon.social/@...' },
    { key: 'diaspora',  label: 'Diaspora',    placeholder: 'https://diaspora.pod/u/...' },
    { key: 'pixelfed',  label: 'Pixelfed',    placeholder: 'https://pixelfed.social/...' },
    { key: 'substack',  label: 'Substack',    placeholder: 'https://yourname.substack.com' },
    { key: 'telegram',  label: 'Telegram',    placeholder: 'https://t.me/...' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileSocialLinksProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileSocialLinks({ register }: Readonly<ProfileSocialLinksProps>) {
    const { t } = useTranslation(['profiles']);

    return (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('edit.socialLinks')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOCIAL_LINK_FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {label}
                        </label>
                        <Input
                            {...register(`socialLinks.${key}`)}
                            type="url"
                            placeholder={placeholder}
                            className="text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
