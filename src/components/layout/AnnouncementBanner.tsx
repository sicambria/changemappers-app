'use client';

import { useEffect, useState } from 'react';
import { acknowledgeAnnouncement, getActiveAnnouncements } from '@/app/actions/announcements';
import { AlertTriangleIcon, CheckIcon, InfoIcon } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'SECURITY';
  backgroundColor: string | null;
  textColor: string | null;
  requireAck: boolean;
};

const toneClasses = {
  INFO: {
    banner: 'bg-white text-emerald-800 border-b border-emerald-100',
    iconWrap: 'bg-emerald-100',
    icon: 'text-emerald-600',
    button: 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 focus:ring-emerald-500',
  },
  SECURITY: {
    banner: 'bg-red-600 text-white',
    iconWrap: 'bg-black/20',
    icon: 'text-white',
    button: 'bg-white text-red-700 border-transparent hover:bg-gray-50 focus:ring-white',
  },
} as const;

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getActiveAnnouncements();
        setAnnouncements(data);
      } catch {
        setAnnouncements([]);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleAck = async (id: string) => {
    try {
      await acknowledgeAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      if (currentIndex >= announcements.length - 1) {
        setCurrentIndex(Math.max(0, announcements.length - 2));
      }
    } catch {
      // Server-side action logs and response capture carry the actionable failure signal.
    }
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const isSecurity = current.type === 'SECURITY';
  const classes = toneClasses[current.type];

  return (
    <div
      key={current.id}
      className={`${classes.banner} relative z-50 overflow-hidden shadow-sm`}
      data-testid="announcement-banner"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <span className={`flex rounded-lg p-2 ${classes.iconWrap}`}>
              {isSecurity ? (
                <AlertTriangleIcon className={`h-5 w-5 ${classes.icon}`} aria-hidden="true" />
              ) : (
                <InfoIcon className={`h-5 w-5 ${classes.icon}`} aria-hidden="true" />
              )}
            </span>
            <p className="font-medium">
              <span className="md:hidden">{current.title}</span>
              <span className="hidden md:inline">
                <strong className="font-bold">{current.title}:</strong> {current.content}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {announcements.length > 1 && (
              <div className="mr-4 flex items-center gap-1 text-xs opacity-80">
                {currentIndex + 1} / {announcements.length}
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % announcements.length)}
                  className="ml-2 underline hover:opacity-100"
                  type="button"
                >
                  Next
                </button>
              </div>
            )}

            <button
              onClick={() => handleAck(current.id)}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${classes.button}`}
              type="button"
            >
              <CheckIcon className="h-4 w-4" />
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
