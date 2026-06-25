'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreateAnnouncement } from '@/app/actions/announcements';
import { ArrowLeftIcon, SaveIcon, SendIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const [type, setType] = useState<'INFO' | 'SECURITY'>('INFO');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append('isPermanent', String(isPermanent));

    try {
      const res = await adminCreateAnnouncement(formData);
      if (res.success) {
        router.push('/admin/announcements');
      } else {
        alert(res.error || t('announcements.errors.createFailed'));
      }
    } catch (error) {
      console.error(error);
      alert(t('announcements.errors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/announcements" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t('announcements.form.newTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <div className="space-y-4 md:col-span-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">{t('announcements.form.title')}</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                placeholder={t('announcements.form.titlePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">{t('announcements.form.content')}</label>
              <textarea
                id="content"
                name="content"
                required
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                placeholder={t('announcements.form.contentPlaceholder')}
              ></textarea>
            </div>
          </div>

          {/* Type & Ack */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">{t('announcements.form.type')}</label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'INFO' | 'SECURITY')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
            >
              <option value="INFO">{t('announcements.form.infoOption')}</option>
              <option value="SECURITY">{t('announcements.form.securityOption')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="requireAck"
              name="requireAck"
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="requireAck" className="text-sm font-medium text-gray-700">{t('announcements.form.requireAckDetailed')}</label>
          </div>

          {/* Timing */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPermanent"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isPermanent" className="text-sm font-medium text-gray-700">{t('announcements.form.permanentDetailed')}</label>
            </div>

            {!isPermanent && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{t('announcements.form.startDate')}</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{t('announcements.form.endDate')}</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Colors */}
          <div>
            <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">{t('announcements.form.backgroundColor')}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                id="backgroundColor"
                name="backgroundColor"
                defaultValue={type === 'SECURITY' ? '#dc2626' : '#059669'}
                className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
              />
              <span className="text-xs text-gray-500">{t('announcements.form.defaultOrCustom')}</span>
            </div>
          </div>
          <div>
            <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">{t('announcements.form.textColor')}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                id="textColor"
                name="textColor"
                defaultValue="#ffffff"
                className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
              />
              <span className="text-xs text-gray-500">{t('announcements.form.defaultWhite')}</span>
            </div>
          </div>

          {/* Email Option */}
          <div className="md:col-span-2">
            <div className="rounded-md bg-emerald-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <SendIcon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    name="sendEmail"
                    value="true"
                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="sendEmail" className="text-sm font-medium text-emerald-800">
                    {t('announcements.form.sendEmail')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/announcements"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('announcements.form.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            <SaveIcon className="h-4 w-4" />
            {loading ? t('announcements.form.creating') : t('announcements.form.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
