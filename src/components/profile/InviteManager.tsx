'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
	MailIcon,
	CopyIcon,
	CheckIcon,
	UsersIcon,
	ClockIcon,
	RefreshCwIcon,
	SendIcon,
	AlertCircleIcon,
} from 'lucide-react';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  generateInviteCodeAction,
  sendInviteEmailAction,
  getMyInvitesAction,
  getInviteStatsAction,
} from '@/app/actions/invite';
import { InviteStatus } from '@/lib/prisma-shared';

interface Invite {
  id: string;
  code: string;
  recipientEmail: string | null;
  status: InviteStatus;
  createdAt: Date;
  expiresAt: Date;
  sentAt: Date | null;
  openedAt: Date | null;
  acceptedAt: Date | null;
}

interface InviteStats {
  availableSlots: number;
  totalSlots: number;
  nextSlotDate: Date | null;
  activeInvites: number;
  acceptedInvites: number;
}

export function InviteManager() {
	const { t, i18n } = useTranslation(['profiles', 'common']);
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sendRequirementsId = 'invite-email-requirements';
  const sendRequirements = [
    !recipientEmail.trim() ? t('common:actionRequirements.enterInviteRecipient') : null,
  ];


  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invitesResult, statsResult] = await Promise.all([
        getMyInvitesAction(),
        getInviteStatsAction(),
      ]);
      if (invitesResult.success && invitesResult.data) {
        setInvites(invitesResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch {
      setError(translateRef.current('invites.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateCode = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateInviteCodeAction();
      if (result.success && result.data) {
        await loadData();
      } else {
        setError(result.error || t('invites.errors.createFailed'));
      }
    } catch {
      setError(t('invites.errors.createFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedInvite || !recipientEmail) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendInviteEmailAction(selectedInvite.id, recipientEmail);
      if (result.success) {
        setShowSendDialog(false);
        setRecipientEmail('');
        setSelectedInvite(null);
        await loadData();
      } else {
        setError(result.error || t('invites.errors.emailFailed'));
      }
    } catch {
      setError(t('invites.errors.emailFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString(i18n?.language || 'hu', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: InviteStatus) => {
    const statusConfig: Record<InviteStatus, { bg: string; text: string; label: string }> = {
      CREATED: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: t('invites.status.created') },
      SENT: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: t('invites.status.sent') },
      OPENED: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: t('invites.status.opened') },
      ACCEPTED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: t('invites.status.accepted') },
      EXPIRED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: t('invites.status.expired') },
      REVOKED: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', label: t('invites.status.revoked') },
    };
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse text-gray-400 text-center">{t('common:actions.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showSendDialog && selectedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('invites.sendDialog.title')}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('invites.sendDialog.recipientEmail')}
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('invites.sendDialog.recipientEmailPlaceholder')}
              />
            </div>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('invites.sendDialog.inviteCodePrefix')} <span className="font-mono font-bold">{selectedInvite.code}</span>
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
            )}
            <ActionRequirements id={sendRequirementsId} requirements={sendRequirements} className="mb-4" />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSendDialog(false);
                  setRecipientEmail('');
                  setSelectedInvite(null);
                  setError(null);
                }}
                disabled={sending}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendEmail}
                disabled={sending || !recipientEmail}
                disabledReasonId={sendRequirements.some(Boolean) ? sendRequirementsId : undefined}
              >
                {sending ? t('invites.actions.sending') : t('invites.actions.send')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="h-5 w-5 text-emerald-600" />
            {t('invites.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircleIcon className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
                  <UsersIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('invites.stats.available')}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.availableSlots}/{stats.totalSlots}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                  <SendIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('invites.stats.active')}</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.activeInvites}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('invites.stats.accepted')}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.acceptedInvites}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                  <ClockIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('invites.stats.nextSlot')}</span>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stats.nextSlotDate
                    ? formatDate(stats.nextSlotDate)
                    : t('invites.stats.maxReached')}
                </p>
              </div>
            </div>
          )}

          {/* Generate button */}
          {(stats?.availableSlots ?? 0) > 0 && (
            <Button
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? t('invites.actions.creating') : t('invites.actions.createCode')}
            </Button>
          )}

          {/* Invite list */}
          {invites.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invites.myInvites')}
              </h3>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                          {invite.code}
                        </span>
                        {getStatusBadge(invite.status)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {invite.recipientEmail && (
                          <span className="mr-3">{invite.recipientEmail}</span>
                        )}
                        <span>
                          {t('invites.expires', { date: formatDate(invite.expiresAt) })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {invite.status === InviteStatus.CREATED && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvite(invite);
                            setShowSendDialog(true);
                          }}
                        >
                          <SendIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(invite.code)}
                      >
                        {copiedCode === invite.code ? (
                          <CheckIcon className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MailIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t('invites.empty.title')}</p>
              {stats?.availableSlots === 0 && (
                <p className="text-sm mt-1">{t('invites.empty.nextSlotHint')}</p>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p>{t('invites.info.weeklySlots')}</p>
            <p>{t('invites.info.expiry')}</p>
            <p>{t('invites.info.revokedSlot')}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
