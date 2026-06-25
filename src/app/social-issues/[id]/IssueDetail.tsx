'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	ArrowLeftIcon,
	MapPinIcon,
	AlertTriangleIcon,
	CheckCircleIcon,
	XCircleIcon,
	ExternalLinkIcon,
	PencilIcon,
	TrashIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { vouchForIssue, disputeIssue, deleteSocialIssue } from '@/app/actions/social-issue';
import type { SocialIssue } from '@/types/social-issue';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

function IssueMapView({ latitude, longitude, title }: Readonly<{ latitude: number; longitude: number; title: string }>) {
  return (
    <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer center={[latitude, longitude]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

interface IssueDetailProps {
  issue: SocialIssue;
}

export function IssueDetail({ issue }: Readonly<IssueDetailProps>) {
	const { t } = useTranslation('social-issues');
	const router = useRouter();
	const [isVouching, setIsVouching] = useState(false);
	const [isDisputing, setIsDisputing] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [disputeReason, setDisputeReason] = useState('');
	const [showDisputeForm, setShowDisputeForm] = useState(false);
	const [vouchCount, setVouchCount] = useState(issue.vouchCount || 0);
	const [disputeCount, setDisputeCount] = useState(issue.disputeCount || 0);
	const [hasVouched, setHasVouched] = useState(false);

	const handleVouch = async () => {
		setIsVouching(true);
		const result = await vouchForIssue(issue.id);
		if (result.success) {
			setVouchCount((prev) => prev + 1);
			setHasVouched(true);
		}
		setIsVouching(false);
	};

	const handleDispute = async () => {
		if (!disputeReason.trim()) return;
		setIsDisputing(true);
		const result = await disputeIssue(issue.id, disputeReason);
		if (result.success) {
			setDisputeCount((prev) => prev + 1);
			setShowDisputeForm(false);
		}
		setIsDisputing(false);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await deleteSocialIssue(issue.id);
		if (result.success) {
			router.push('/social-issues');
		}
		setIsDeleting(false);
	};

  const getSeverityColor = () => {
    switch (issue.severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/social-issues"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('backToList')}
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  issue.isLocalizable ? 'bg-red-100 dark:bg-red-900/50' : 'bg-purple-100 dark:bg-purple-900/50'
                }`}
              >
                {issue.isLocalizable ? (
                  <MapPinIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertTriangleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{issue.title}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {t(`categories.${issue.category}`)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor()}`}>
                    {t(`severity.${issue.severity}`)}
                  </span>
                  {issue.scope && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {t(`scope.${issue.scope}`)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {issue.description && (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{issue.description}</p>
              </div>
            )}

            {issue.locationName && (
              <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4" />
                <span>{issue.locationName}</span>
              </div>
            )}

				{issue.relatedRdgs.length > 0 && (
					<div className="mt-4">
						<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('form.rdgRequired')}</h3>
						<div className="flex flex-wrap gap-2">
							{issue.relatedRdgs.map((rdg) => (
								<span
									key={rdg}
									className="px-2 py-1 text-xs rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
								>
									{t(`rdgs.${rdg}`)}
								</span>
							))}
						</div>
					</div>
				)}

				{(issue.leanWastes?.filter((w) => !w.startsWith('HARM_')).length ?? 0) > 0 && (
					<div className="mt-4">
						<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('leanWastes.title')}</h3>
						<div className="flex flex-wrap gap-2">
							{issue.leanWastes.filter((w) => !w.startsWith('HARM_')).map((waste) => (
								<span
									key={waste}
									className="px-2 py-1 text-xs rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
								>
									{t(`leanWastes.${waste}`)}
								</span>
							))}
						</div>
					</div>
				)}

				{(issue.leanWastes?.filter((w) => w.startsWith('HARM_')).length ?? 0) > 0 && (
					<div className="mt-4">
						<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('harmTypes.title')}</h3>
						<div className="flex flex-wrap gap-2">
							{issue.leanWastes.filter((w) => w.startsWith('HARM_')).map((harm) => (
								<span
									key={harm}
									className="px-2 py-1 text-xs rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
								>
									{t(`harmTypes.${harm}`)}
								</span>
							))}
						</div>
					</div>
				)}

				{issue.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {issue.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {issue.sources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('form.sources')}</h3>
                <div className="space-y-2">
                  {issue.sources.map((source) => (
                    <a
                      key={source}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                      {source}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {issue.isLocalizable && issue.latitude && issue.longitude && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('form.location')}</h3>
              <IssueMapView latitude={issue.latitude} longitude={issue.longitude} title={issue.title} />
            </Card>
          )}
        </div>

        <div className="lg:w-72 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('verification.verificationLevel')}
            </h3>
            <div className="flex items-center gap-2">
              <CheckCircleIcon
                className={`h-5 w-5 ${(() => {
                  if (issue.verificationLevel === 'COMMUNITY_VERIFIED' || issue.verificationLevel === 'ADMIN_VERIFIED') return 'text-green-600';
                  if (issue.verificationLevel === 'PEER_VOUCHED') return 'text-yellow-600';
                  return 'text-gray-400';
                })()}`}
              />
              <span className="text-sm">{t(`verification.${issue.verificationLevel}`)}</span>
            </div>

            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="font-medium">{vouchCount}</span>
                <span className="text-gray-500 ml-1">{t('verification.vouchCount', { count: vouchCount })}</span>
              </div>
              <div>
                <span className="font-medium">{disputeCount}</span>
                <span className="text-gray-500 ml-1">{t('verification.disputeCount', { count: disputeCount })}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('verification.title')}</h3>

            <Button
              variant={hasVouched ? 'secondary' : 'primary'}
              size="sm"
              className="w-full mb-2"
              onClick={handleVouch}
              disabled={isVouching || hasVouched}
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {hasVouched ? t('verification.vouched') : t('verification.vouch')}
            </Button>

            {showDisputeForm ? (
              <div className="space-y-2">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder={t('verification.disputeReasonPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDispute}
                    disabled={isDisputing || disputeReason.length < 10}
                    disabledReasonId={disputeReason.length < 10 ? 'issue-dispute-requirements' : undefined}
                  >
                    {t('verification.submitDispute')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDisputeForm(false)}>
                    {t('form.cancel')}
                  </Button>
                </div>
                <ActionRequirements id="issue-dispute-requirements" requirements={[disputeReason.length < 10 ? t('common:actionRequirements.enterDisputeReason', { count: 10 }) : null]} />
			</div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowDisputeForm(true)}
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                {t('verification.dispute')}
              </Button>
			)}
			</Card>
			<Card className="p-4 mt-4">
				<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('common:actions.edit')}</h3>
				<div className="flex flex-col gap-2">
					<Link href={`/social-issues/${issue.id}/edit`}>
						<Button variant="outline" size="sm" className="w-full">
							<PencilIcon className="h-4 w-4 mr-2" />
							{t('edit')}
						</Button>
					</Link>
					{showDeleteConfirm ? (
						<div className="flex flex-col gap-2">
							<p className="text-xs text-red-600 dark:text-red-400">{t('deleteConfirm')}</p>
							<Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
								{isDeleting ? t('common:actions.loading') : t('common:actions.confirm')}
							</Button>
							<Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
								{t('form.cancel')}
							</Button>
						</div>
					) : (
						<Button variant="outline" size="sm" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
							<TrashIcon className="h-4 w-4 mr-2" />
							{t('delete')}
						</Button>
					)}
				</div>
			</Card>
		</div>
	</div>
</div>
);
}
