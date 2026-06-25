'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminGetAnnouncement, adminUpdateAnnouncement } from '@/app/actions/announcements';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type AnnouncementData = NonNullable<Awaited<ReturnType<typeof adminGetAnnouncement>>>;

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation('admin');
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const data = await adminGetAnnouncement(id);
        if (data) {
          setAnnouncement(data);
          setIsPermanent(data.isPermanent);
          setIsActive(data.isActive);
        } else {
          router.push('/admin/announcements');
        }
      } catch (error) {
        console.error(error);
        router.push('/admin/announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.append('isPermanent', String(isPermanent));
    formData.append('isActive', String(isActive));

    try {
      const res = await adminUpdateAnnouncement(id, formData);
      if (res.success) {
        router.push('/admin/announcements');
      } else {
        alert(res.error || t('announcements.errors.updateFailed'));
      }
    } catch (error) {
      console.error(error);
      alert(t('announcements.errors.unexpected'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !announcement) return <div className="flex justify-center p-10 text-gray-500">{t('announcements.form.loading')}</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/announcements" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t('announcements.form.editTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Status Toggle */}
          <div className="flex items-center gap-2 md:col-span-2 rounded-md bg-gray-50 p-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-gray-700 uppercase tracking-tight">{t('announcements.form.activeVisibility')}</label>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 md:col-span-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">{t('announcements.form.title')}</label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={announcement.title}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">{t('announcements.form.content')}</label>
              <textarea
                id="content"
                name="content"
                defaultValue={announcement.content}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
              ></textarea>
            </div>
          </div>

          {/* Type & Ack */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">{t('announcements.form.type')}</label>
            <select
              id="type"
              name="type"
              defaultValue={announcement.type}
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
              defaultChecked={announcement.requireAck}
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="requireAck" className="text-sm font-medium text-gray-700">{t('announcements.form.requireAck')}</label>
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
              <label htmlFor="isPermanent" className="text-sm font-medium text-gray-700">{t('announcements.form.permanent')}</label>
            </div>

            {!isPermanent && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{t('announcements.form.startDate')}</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    defaultValue={announcement.startDate ? new Date(announcement.startDate).toISOString().slice(0, 16) : ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{t('announcements.form.endDate')}</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    defaultValue={announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : ''}
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
                defaultValue={announcement.backgroundColor || (announcement.type === 'SECURITY' ? '#dc2626' : '#059669')}
                className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">{t('announcements.form.textColor')}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                id="textColor"
                name="textColor"
                defaultValue={announcement.textColor || '#ffffff'}
                className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
              />
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
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            <SaveIcon className="h-4 w-4" />
            {saving ? t('announcements.form.saving') : t('announcements.form.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
