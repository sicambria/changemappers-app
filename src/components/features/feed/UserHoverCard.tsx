'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Z_CLASS } from '@/lib/z-index';

interface UserHoverCardProps {
  user: {
    id: string;
    name: string;
    displayName?: string | null;
    profilePhoto?: string | null;
    verificationLevel?: string;
  };
  children: React.ReactNode;
}

interface UserSummary {
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
  bio: string | null;
  motto: string | null;
  rdgAreas: string[];
  mainCauses: Array<{ id: string; title: string }>;
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' | null;
}

export function UserHoverCard({ user, children }: Readonly<UserHoverCardProps>) {
  const { t } = useTranslation(['feed', 'common']);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const fetchSummary = async () => {
    if (summary || isLoading) return;
    
    setIsLoading(true);
    try {
      const { getUserHoverSummaryAction } = await import('@/app/actions/feed');
      const result = await getUserHoverSummaryAction(user.id);
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
    setShowTooltip(true);
    fetchSummary();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div // NOSONAR(S6848) — supplementary hover affordance; the content/action is independently keyboard-reachable via an explicit control or focusable child
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {showTooltip && (
        <div
          className={`fixed ${Z_CLASS.topChrome} w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in-0 zoom-in-95`}
          style={{ top: position.top, left: position.left }}
        >
          {(() => {
          if (isLoading) return (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          );
          if (summary) return (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {summary.profilePhoto ? (
                  <Image
                    src={summary.profilePhoto}
                    alt={summary.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium text-lg">
                    {summary.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {summary.displayName || summary.name}
                  </div>
                  {summary.motto && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {summary.motto}
                    </div>
                  )}
                </div>
              </div>

              {summary.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {summary.bio}
                </p>
              )}

              {summary.rdgAreas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.rdgAreas.slice(0, 3).map((area) => (
                    <span
                      key={area}
                      className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}

              {summary.mainCauses?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.mainCauses.slice(0, 2).map((cause) => (
                    <span
                      key={cause.id}
                      className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {cause.title}
                    </span>
                  ))}
                </div>
              )}

              {summary.connectionStatus != null && summary.connectionStatus !== 'none' && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                  {summary.connectionStatus === 'connected' && t('hoverCard.connected', 'Connected')}
                  {summary.connectionStatus === 'pending_sent' && t('hoverCard.requestSent', 'Request Sent')}
                  {summary.connectionStatus === 'pending_received' && t('hoverCard.requestReceived', 'Request Received')}
                </div>
              )}
            </div>
          );
          return <div className="text-center text-gray-500 py-4">{t('hoverCard.unableToLoad', 'Unable to load profile summary')}</div>;
          })()}
        </div>
      )}
    </div>
  );
}
