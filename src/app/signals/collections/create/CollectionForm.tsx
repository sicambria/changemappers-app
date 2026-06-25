'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createSignalCollection } from '@/app/actions/weak-signal-collection';
import { useValidationErrors } from '@/hooks/useValidationErrors';

export function CollectionForm() {
  const { t } = useTranslation('signals');
  const router = useRouter();
  const { formError, setErrors, clearErrors, getFieldError, clearFieldError } = useValidationErrors();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!form.name.trim()) {
      setErrors({ success: false, error: t('errors.nameRequired') });
      return;
    }

    setSaving(true);
    try {
      const result = await createSignalCollection(form);

      if (result.success && result.data) {
        const id = (result.data as { id: string }).id;
        router.push(`/signals/collections/${id}`);
      } else {
        setErrors(result);
      }
    } catch (err) {
      console.error('Error creating collection:', err);
      setErrors({ success: false, error: t('errors.createCollectionFailed') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
          <FolderIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('collection.create')}
          </h1>
        </div>
      </div>

      {formError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('collection.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); clearFieldError('name'); }}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${getFieldError('name') ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t('collection.namePlaceholder')}
            maxLength={200}
            required
          />
          {getFieldError('name') && <p className="text-xs text-red-500 mt-1">{getFieldError('name')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('collection.description')}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder={t('collection.descriptionPlaceholder')}
            rows={4}
            maxLength={2000}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? t('form.submitting') : t('collection.create')}
          </Button>
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            {t('form.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
