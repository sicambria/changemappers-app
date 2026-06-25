'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Users, CheckCircle, Clock, LogIn, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import VideoMeetingClient from '@/app/video/VideoMeetingClient';
import SchedulingPollFormClient from './SchedulingPollFormClient';

interface PollSummary {
  id: string;
  title: string;
  organizerName: string;
  confirmedAt: Date | null;
  createdAt: Date;
  participantToken: string;
  organizerToken: string;
  _count: { responses: number };
}

interface MeetPageContentProps {
  isLoggedIn: boolean;
  prefillName: string | null;
  userPolls: PollSummary[] | null;
  initialVideoRoomName?: string;
  initialVideoError?: string;
  currentUser?: {
    name?: string;
    displayName?: string;
    email?: string;
  };
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default function MeetPageContent({
  isLoggedIn,
  prefillName,
  userPolls,
  initialVideoRoomName,
  initialVideoError,
  currentUser,
}: Readonly<MeetPageContentProps>) {
  const { t, i18n } = useTranslation('scheduling');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVideoSetup, setShowVideoSetup] = useState(Boolean(initialVideoRoomName || initialVideoError));

  if (showVideoSetup) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowVideoSetup(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t('create.backToPolls')}
        </button>
        <VideoMeetingClient
          initialRoomName={initialVideoRoomName}
          initialError={initialVideoError}
          currentUser={currentUser}
          basePath="/meet"
        />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← {t('create.backToPolls', { defaultValue: 'Back to polls' })}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('create.title')}</h1>
          <p className="text-gray-500 text-sm">{t('create.subtitle')}</p>
        </div>
        <SchedulingPollFormClient prefillName={prefillName} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('myPolls.title')}</h1>
            <p className="text-gray-500 text-sm">{t('myPolls.subtitle', { defaultValue: 'Find the best time for your group to meet' })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowVideoSetup(true)}>
              <Video className="h-4 w-4 mr-2" />
              {t('myPolls.startVideoRoom')}
            </Button>
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('myPolls.createNew')}
            </Button>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <LogIn className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {t('myPolls.loginPrompt', { defaultValue: 'Log in to save your polls to your profile' })}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {t('myPolls.loginBenefit', { defaultValue: 'Logged-in users can access their organizer links from any device.' })}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      {t('myPolls.login', { defaultValue: 'Log in' })}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      {t('myPolls.register', { defaultValue: 'Create account' })}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoggedIn && (userPolls?.length ?? 0) > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-700">
              {t('myPolls.organized', { defaultValue: 'Your Organized Meetings' })}
            </h2>
            <div className="grid gap-3">
              {userPolls?.map((poll) => (
                <Link
                  key={poll.id}
                  href={`/meet/organizer/${poll.organizerToken}`}
                  className="block p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{poll.title}</h3>
                        {poll.confirmedAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            {t('myPolls.confirmed')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            <Clock className="h-3 w-3" />
                            {t('myPolls.pending')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(poll.createdAt, i18n.resolvedLanguage || 'en')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {poll._count.responses} {t('myPolls.responses').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {isLoggedIn && userPolls?.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t('myPolls.noPolls')}</p>
            <Button variant="primary" className="mt-4" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('myPolls.createFirst')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
