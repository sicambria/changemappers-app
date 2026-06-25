'use client';

import { useTranslation } from 'react-i18next';
import { XIcon, CheckIcon, CircleIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import type { CompletenessItem } from '@/hooks/useProfileCompleteness';
import { Z_CLASS } from '@/lib/z-index';

interface ProfileCompletenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  percentage: number;
  items: CompletenessItem[];
  onEditProfile: () => void;
}

export function ProfileCompletenessModal({
  isOpen,
  onClose,
  percentage,
  items,
  onEditProfile,
}: Readonly<ProfileCompletenessModalProps>) {
  const { t } = useTranslation(['profiles', 'common']);

  if (!isOpen) return null;

  const categories = [
    { key: 'basic', label: t('completenessModal.categories.basic') },
    { key: 'skills', label: t('completenessModal.categories.skills') },
    { key: 'questionnaire', label: t('completenessModal.categories.questionnaire') },
    { key: 'links', label: t('completenessModal.categories.links', 'Links & Causes') },
    { key: 'verification', label: t('completenessModal.categories.verification') },
  ] as const;

  const handleEditProfile = () => {
    onClose();
    onEditProfile();
  };

  return (
    <div className={`fixed inset-0 ${Z_CLASS.topChrome} flex items-center justify-center p-4`}>
      <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('completenessModal.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('completenessModal.percentage', { percent: percentage })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label={t('common:actions.close')}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {categories.map(category => {
            const categoryItems = items.filter(item => item.category === category.key);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.key} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  {category.label}
                </h3>
                <ul className="space-y-2">
                  {categoryItems.map(item => (
                    <li key={item.key} className="flex items-center gap-3">
                      {item.complete ? (
                        <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <CircleIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          item.complete
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {t(`completenessModal.fields.${item.key}`, item.label)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">
            {t('completenessModal.benefits')}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t('completenessModal.close')}
            </Button>
            <Button className="flex-1" onClick={handleEditProfile}>
              {t('completenessModal.editProfile')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
