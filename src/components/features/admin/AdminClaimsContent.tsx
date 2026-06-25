'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { approveClaimAction, rejectClaimAction } from '@/app/actions/claim';
import { CheckCircleIcon, XCircleIcon, ShieldIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useRef, useState, type FormEvent } from 'react';
import type { ClaimStatus } from '@/lib/prisma-shared';

type ClaimItem = {
  id: string;
  name?: string;
  title?: string;
  updatedAt: string | Date;
  claimStatus: ClaimStatus;
  claimRequestBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type AdminClaimsContentProps = {
  communityClaims: ClaimItem[];
  eventClaims: ClaimItem[];
  currentStatus: ClaimStatus;
  counts: { pending: number; claimed: number; rejected: number };
};

const STATUS_TABS: { value: ClaimStatus; labelKey: string; color: string }[] = [
  { value: 'PENDING', labelKey: 'claims.tabs.pending', color: 'border-amber-400 text-amber-700' },
  { value: 'CLAIMED', labelKey: 'claims.tabs.claimed', color: 'border-emerald-400 text-emerald-700' },
  { value: 'REJECTED', labelKey: 'claims.tabs.rejected', color: 'border-red-400 text-red-700' },
];

function getClaimStatusBadge(status: ClaimStatus, t: (key: string) => string) {
  switch (status) {
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-800">{t('claims.tabs.pending')}</Badge>;
    case 'CLAIMED':
      return <Badge className="bg-emerald-100 text-emerald-800">{t('claims.tabs.claimed')}</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-800">{t('claims.tabs.rejected')}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function ApproveForm({ id, type, t }: Readonly<{ id: string; type: 'COMMUNITY' | 'EVENT'; t: (key: string) => string }>) {
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);
  return (
    <form onSubmit={async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pendingRef.current) return;
      pendingRef.current = true;
      setIsPending(true);
      try {
        await approveClaimAction(type, id);
      } finally {
        pendingRef.current = false;
        setIsPending(false);
      }
    }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={type} />
      <Button type="submit" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending} isLoading={isPending}>
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        {t('claims.approve')}
      </Button>
    </form>
  );
}

function RejectForm({ id, type, t }: Readonly<{ id: string; type: 'COMMUNITY' | 'EVENT'; t: (key: string) => string }>) {
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);
  return (
    <form onSubmit={async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pendingRef.current) return;
      pendingRef.current = true;
      setIsPending(true);
      try {
        await rejectClaimAction(type, id);
      } finally {
        pendingRef.current = false;
        setIsPending(false);
      }
    }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={type} />
      <Button type="submit" size="sm" variant="danger" className="w-full" disabled={isPending} isLoading={isPending}>
        <XCircleIcon className="h-4 w-4 mr-1" />
        {t('claims.reject')}
      </Button>
    </form>
  );
}

export function AdminClaimsContent({ communityClaims, eventClaims, currentStatus, counts }: Readonly<AdminClaimsContentProps>) {
  const { t, i18n } = useTranslation('admin');
  const dateLocale = i18n.resolvedLanguage || 'en';
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasClaims = communityClaims.length > 0 || eventClaims.length > 0;
  const showActions = currentStatus === 'PENDING';

  const handleTabChange = (status: ClaimStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.push(`/admin/claims?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              currentStatus === tab.value
                ? `${tab.color} border-current font-bold`
                : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {t(tab.labelKey)}
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
              {counts[tab.value.toLowerCase() as keyof typeof counts] || 0}
            </span>
          </button>
        ))}
      </div>

      {hasClaims ? (
        <div className="space-y-8">
          {communityClaims.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('claims.communities')} ({communityClaims.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {communityClaims.map((community) => (
                  <Card key={community.id} className="overflow-hidden" data-testid="claim-card">
                    <div className={`h-2 ${(() => {
                      if (community.claimStatus === 'CLAIMED') return 'bg-emerald-500';
                      if (community.claimStatus === 'REJECTED') return 'bg-red-500';
                      return 'bg-amber-500';
                    })()}`} />
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span className="truncate" title={community.name}>{community.name}</span>
                        {getClaimStatusBadge(community.claimStatus, t)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm space-y-2">
                        <p className="text-gray-500">{t('claims.claimant')}</p>
                        <div className="font-medium flex items-center gap-2">
                          {community.claimRequestBy?.name || t('claims.unknown')}
                          <span className="text-xs text-gray-400">({community.claimRequestBy?.email})</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {t('claims.claimedOn')} {new Date(community.updatedAt).toLocaleDateString(dateLocale)}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/communities/${community.id}`} target="_blank" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLinkIcon className="h-4 w-4 mr-1" />
                            {t('claims.view')}
                          </Button>
                        </Link>
                      </div>

                      {showActions && (
                        <div className="grid grid-cols-2 gap-2">
                          <ApproveForm id={community.id} type="COMMUNITY" t={t} />
                          <RejectForm id={community.id} type="COMMUNITY" t={t} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {eventClaims.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('claims.events')} ({eventClaims.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventClaims.map((event) => (
                  <Card key={event.id} className="overflow-hidden" data-testid="claim-card">
                    <div className={`h-2 ${(() => {
                      if (event.claimStatus === 'CLAIMED') return 'bg-emerald-500';
                      if (event.claimStatus === 'REJECTED') return 'bg-red-500';
                      return 'bg-blue-500';
                    })()}`} />
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span className="truncate" title={event.title}>{event.title}</span>
                        {getClaimStatusBadge(event.claimStatus, t)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm space-y-2">
                        <p className="text-gray-500">{t('claims.claimant')}</p>
                        <div className="font-medium flex items-center gap-2">
                          {event.claimRequestBy?.name || t('claims.unknown')}
                          <span className="text-xs text-gray-400">({event.claimRequestBy?.email})</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/events/${event.id}`} target="_blank" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLinkIcon className="h-4 w-4 mr-1" />
                            {t('claims.view')}
                          </Button>
                        </Link>
                      </div>

                      {showActions && (
                        <div className="grid grid-cols-2 gap-2">
                          <ApproveForm id={event.id} type="EVENT" t={t} />
                          <RejectForm id={event.id} type="EVENT" t={t} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <ShieldIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('claims.noClaimsTitle')}</h3>
          <p className="text-gray-500">{t('claims.noClaimsDesc')}</p>
        </div>
      )}
    </div>
  );
}
