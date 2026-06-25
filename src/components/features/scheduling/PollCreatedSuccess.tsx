'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Link2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CreatedPoll {
  id: string;
  participantToken: string;
  organizerToken: string;
}

interface PollCreatedSuccessProps {
  createdPoll: CreatedPoll;
}

interface CopyableLinkRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
  colorScheme: 'emerald' | 'amber';
  footer?: React.ReactNode;
}

function CopyableLinkRow({
  icon,
  label,
  description,
  url,
  copied,
  onCopy,
  colorScheme,
  footer,
}: Readonly<CopyableLinkRowProps>) {
  const { t } = useTranslation('scheduling');
  const bg = colorScheme === 'emerald' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200';
  const labelColor = colorScheme === 'emerald' ? 'text-emerald-800' : 'text-amber-800';
  const descColor = colorScheme === 'emerald' ? 'text-emerald-600' : 'text-amber-600';
  const inputBorder = colorScheme === 'emerald' ? 'border-emerald-200' : 'border-amber-200';
  return (
    <div className={`p-4 rounded-xl border ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-sm font-medium ${labelColor}`}>{label}</span>
      </div>
      <p className={`text-xs ${descColor} mb-3`}>{description}</p>
      <div className={`flex gap-2${footer ? ' mb-3' : ''}`}>
        <input
          type="text"
          readOnly
          value={url}
          className={`flex-1 px-3 py-2 text-sm bg-white border ${inputBorder} rounded-lg text-gray-700`}
        />
        <Button variant="outline" size="sm" onClick={onCopy} className="shrink-0">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t('created.copied') : t('created.copyLink')}
        </Button>
      </div>
      {footer}
    </div>
  );
}

export function PollCreatedSuccess({ createdPoll }: Readonly<PollCreatedSuccessProps>) {
  const { t } = useTranslation('scheduling');

  const [copiedParticipant, setCopiedParticipant] = useState(false);
  const [copiedOrganizer, setCopiedOrganizer] = useState(false);

  const baseUrl = globalThis.window !== undefined ? globalThis.location.origin : '';
  const participantUrl = `${baseUrl}/meet/${createdPoll.participantToken}`;
  const organizerUrl = `${baseUrl}/meet/organizer/${createdPoll.organizerToken}`;

  const copyToClipboard = async (text: string, setType: 'participant' | 'organizer') => {
    try {
      await navigator.clipboard.writeText(text);
      if (setType === 'participant') {
        setCopiedParticipant(true);
        setTimeout(() => setCopiedParticipant(false), 2000);
      } else {
        setCopiedOrganizer(true);
        setTimeout(() => setCopiedOrganizer(false), 2000);
      }
    } catch {
      // Silent fail for clipboard
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('created.title')}</h2>
        <p className="text-gray-500 text-sm">{t('created.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <CopyableLinkRow
          icon={<Link2 className="h-4 w-4 text-emerald-600" />}
          label={t('created.participantLink')}
          description={t('created.participantLinkDescription')}
          url={participantUrl}
          copied={copiedParticipant}
          onCopy={() => copyToClipboard(participantUrl, 'participant')}
          colorScheme="emerald"
        />
        <CopyableLinkRow
          icon={<ShieldCheck className="h-4 w-4 text-amber-600" />}
          label={t('created.organizerLink')}
          description={t('created.organizerLinkDescription')}
          url={organizerUrl}
          copied={copiedOrganizer}
          onCopy={() => copyToClipboard(organizerUrl, 'organizer')}
          colorScheme="amber"
          footer={
            <p className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
              {t('created.organizerLinkWarning')}
            </p>
          }
        />
      </div>
    </div>
  );
}
