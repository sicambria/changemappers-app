'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  MapPinIcon,
  RadioIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrashIcon,
  AlertTriangleIcon,
  Link2Icon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CommunityCombobox, type CommunityOption } from '@/components/ui/CommunityCombobox';
import { InitiativeCombobox, type InitiativeOption } from '@/components/ui/InitiativeCombobox';
import { resonateWithSignal, corroborateSignal, flagSignalNoise, deleteWeakSignal, getSimilarSignals } from '@/app/actions/weak-signal';
import { getSignalEntityLinks, linkSignalToProject, unlinkSignalFromProject, linkSignalToCommunity, unlinkSignalFromCommunity } from '@/app/actions/weak-signal-links';
import type { WeakSignal, SignalProjectLink, SignalCommunityLink } from '@/types/weak-signal';

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

function SignalMapView({ latitude, longitude, title }: Readonly<{ latitude: number; longitude: number; title: string }>) {
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

function getVerificationColor(level: string): string {
  switch (level) {
    case 'COMMUNITY_VERIFIED':
    case 'ADMIN_VERIFIED':
      return 'text-green-600';
    case 'PEER_VOUCHED':
      return 'text-yellow-600';
    default:
      return 'text-gray-400';
  }
}

function getDomainColor(domain: string): string {
  const colors: Record<string, string> = {
    EDUCATION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    GOVERNANCE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    FOOD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    TECHNOLOGY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    HEALTH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ECONOMY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ECOLOGY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    CULTURE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    ENERGY: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    HOUSING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    TRANSPORT: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    MEDIA: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    JUSTICE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    FINANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colors[domain] || colors.OTHER;
}

interface SignalDetailProps {
  signal: WeakSignal;
}

// Engagement state + handlers (resonate / corroborate / flag / delete + similar
// signals load). Extracted to a hook so this complexity is not attributed to the
// SignalDetail component (S3776); behavior, ordering, and side effects are identical.
function useSignalEngagement(signal: WeakSignal, t: ReturnType<typeof useTranslation>['t'], router: ReturnType<typeof useRouter>) {
  const signalId = signal.id;
  const [isResonating, setIsResonating] = useState(false);
  const [isCorroborating, setIsCorroborating] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [resonatesCount, setResonatesCount] = useState(signal.resonatesCount ?? 0);
  const [_doesntResonateCount, setDoesntResonateCount] = useState(signal.doesntResonateCount ?? 0);
  const [corroborationCount, setCorroborationCount] = useState(signal.corroborationCount ?? 0);
  const [hasResonated, setHasResonated] = useState<'RESONATES' | 'DOESNT_RESONATE' | null>(null);

  const [corroborationEvidence, setCorroborationEvidence] = useState('');
  const [corroborationSourceUrl, setCorroborationSourceUrl] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showCorroborationForm, setShowCorroborationForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);

  const [similarSignals, setSimilarSignals] = useState<WeakSignal[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(true);

  useEffect(() => {
    async function loadSimilar() {
      const result = await getSimilarSignals(signalId, 6);
      if (result.success && result.data) {
        setSimilarSignals(result.data);
      }
      setIsLoadingSimilar(false);
    }
    loadSimilar();
  }, [signalId]);

  const handleResonate = async (vote: 'RESONATES' | 'DOESNT_RESONATE') => {
    setIsResonating(true);
    const result = await resonateWithSignal(signalId, vote);
    if (result.success) {
      if (vote === 'RESONATES') {
        setResonatesCount((prev) => prev + 1);
      } else {
        setDoesntResonateCount((prev) => prev + 1);
      }
      setHasResonated(vote);
    } else {
      toast.error(t('errors.resonateFailed'));
    }
    setIsResonating(false);
  };

  const handleCorroborate = async () => {
    if (!corroborationEvidence.trim() || corroborationEvidence.trim().length < 10) return;
    setIsCorroborating(true);
    const result = await corroborateSignal(signalId, corroborationEvidence, corroborationSourceUrl || undefined);
    if (result.success) {
      setCorroborationCount((prev) => prev + 1);
      setShowCorroborationForm(false);
      setCorroborationEvidence('');
      setCorroborationSourceUrl('');
    } else {
      toast.error(t('errors.corroborateFailed'));
    }
    setIsCorroborating(false);
  };

  const handleFlagNoise = async () => {
    if (!flagReason.trim() || flagReason.trim().length < 10) return;
    setIsFlagging(true);
    const result = await flagSignalNoise(signalId, flagReason);
    if (result.success) {
      setShowFlagForm(false);
      setFlagReason('');
    } else {
      toast.error(t('errors.flagFailed'));
    }
    setIsFlagging(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteWeakSignal(signalId);
    if (result.success) {
      router.push('/signals');
    } else {
      toast.error(t('errors.deleteFailed'));
      setIsDeleting(false);
    }
  };

  return {
    isResonating, isCorroborating, isFlagging, isDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    resonatesCount, setResonatesCount, corroborationCount,
    hasResonated,
    corroborationEvidence, setCorroborationEvidence,
    corroborationSourceUrl, setCorroborationSourceUrl,
    flagReason, setFlagReason,
    showCorroborationForm, setShowCorroborationForm,
    showFlagForm, setShowFlagForm,
    similarSignals, isLoadingSimilar,
    handleResonate, handleCorroborate, handleFlagNoise, handleDelete,
  };
}

// Project/community link state + handlers. Extracted to a hook to keep the
// SignalDetail component under the cognitive-complexity budget (S3776). Behavior,
// refetch ordering, and optimistic updates are identical to the inline code.
function useSignalLinks(signalId: string, t: ReturnType<typeof useTranslation>['t']) {
  const [projectLinks, setProjectLinks] = useState<SignalProjectLink[]>([]);
  const [communityLinks, setCommunityLinks] = useState<SignalCommunityLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [selectedProject, setSelectedProject] = useState<InitiativeOption | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption | null>(null);
  const [isLinkingProject, setIsLinkingProject] = useState(false);
  const [isLinkingCommunity, setIsLinkingCommunity] = useState(false);
  const [unlinkingProjectId, setUnlinkingProjectId] = useState<string | null>(null);
  const [unlinkingCommunityId, setUnlinkingCommunityId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLinks() {
      const result = await getSignalEntityLinks(signalId);
      if (result.success && result.data) {
        setProjectLinks((result.data.projectLinks ?? []) as SignalProjectLink[]);
        setCommunityLinks((result.data.communityLinks ?? []) as SignalCommunityLink[]);
      }
      setIsLoadingLinks(false);
    }
    loadLinks();
  }, [signalId]);

  const handleLinkProject = async () => {
    if (!selectedProject) return;
    setIsLinkingProject(true);
    const result = await linkSignalToProject(signalId, selectedProject.id);
    if (result.success) {
      const linksResult = await getSignalEntityLinks(signalId);
      if (linksResult.success && linksResult.data) {
        setProjectLinks((linksResult.data.projectLinks ?? []) as SignalProjectLink[]);
      }
      setSelectedProject(null);
    } else {
      toast.error(t('errors.linkProjectFailed'));
    }
    setIsLinkingProject(false);
  };

  const handleUnlinkProject = async (projectId: string) => {
    setUnlinkingProjectId(projectId);
    const result = await unlinkSignalFromProject(signalId, projectId);
    if (result.success) {
      setProjectLinks((prev) => prev.filter((l) => l.projectId !== projectId));
    } else {
      toast.error(t('errors.unlinkProjectFailed'));
    }
    setUnlinkingProjectId(null);
  };

  const handleLinkCommunity = async () => {
    if (!selectedCommunity) return;
    setIsLinkingCommunity(true);
    const result = await linkSignalToCommunity(signalId, selectedCommunity.id);
    if (result.success) {
      const linksResult = await getSignalEntityLinks(signalId);
      if (linksResult.success && linksResult.data) {
        setCommunityLinks((linksResult.data.communityLinks ?? []) as SignalCommunityLink[]);
      }
      setSelectedCommunity(null);
    } else {
      toast.error(t('errors.linkCommunityFailed'));
    }
    setIsLinkingCommunity(false);
  };

  const handleUnlinkCommunity = async (communityId: string) => {
    setUnlinkingCommunityId(communityId);
    const result = await unlinkSignalFromCommunity(signalId, communityId);
    if (result.success) {
      setCommunityLinks((prev) => prev.filter((l) => l.communityId !== communityId));
    } else {
      toast.error(t('errors.unlinkCommunityFailed'));
    }
    setUnlinkingCommunityId(null);
  };

  return {
    projectLinks, communityLinks, isLoadingLinks,
    selectedProject, setSelectedProject, selectedCommunity, setSelectedCommunity,
    isLinkingProject, isLinkingCommunity, unlinkingProjectId, unlinkingCommunityId,
    handleLinkProject, handleUnlinkProject, handleLinkCommunity, handleUnlinkCommunity,
  };
}

type TFn = ReturnType<typeof useTranslation>['t'];

// Header + descriptive sections + optional location map. Pure render; extracted so the
// SignalDetail component's JSX conditionals do not push it over the cc budget (S3776).
function SignalInfoCard({ signal, t }: Readonly<{ signal: WeakSignal; t: TFn }>) {
  return (
    <>
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
            <RadioIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{signal.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                {t(`domains.${signal.domain}`)}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                {t(`scale.${signal.scale}`)}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {t(`verification.${signal.verificationLevel}`)}
              </span>
            </div>
          </div>
        </div>

        {signal.description && (
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{signal.description}</p>
          </div>
        )}

        {signal.context && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('form.context')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{signal.context}</p>
          </div>
        )}

        {signal.locationName && (
          <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPinIcon className="h-4 w-4" />
            <span>{signal.locationName}</span>
          </div>
        )}

        {signal.sourceUrl && (
          <div className="mt-4">
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              <ExternalLinkIcon className="h-3 w-3" />
              {t('detail.sourceUrl')}
            </a>
          </div>
        )}

        {signal.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {signal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {signal.community && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('detail.community')}</h3>
            <span className="text-sm text-gray-600 dark:text-gray-300">{signal.community.name}</span>
          </div>
        )}

        {signal.pattern && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('detail.pattern')}</h3>
            <span className="text-sm text-gray-600 dark:text-gray-300">{signal.pattern.name}</span>
          </div>
        )}
      </Card>

      {signal.isLocalizable && signal.latitude && signal.longitude && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('detail.location')}</h3>
          <SignalMapView latitude={signal.latitude} longitude={signal.longitude} title={signal.title} />
        </Card>
      )}
    </>
  );
}

// Body of the similar-signals card: loading / empty / list. Pure render; replaces the
// inline IIFE so the IIFE's branch complexity leaves the SignalDetail component (S3776).
function SimilarSignalsBody({ isLoadingSimilar, similarSignals, t }: Readonly<{ isLoadingSimilar: boolean; similarSignals: WeakSignal[]; t: TFn }>) {
  if (isLoadingSimilar) return <div className="text-sm text-gray-500">{t('common:loading')}</div>;
  if (similarSignals.length === 0) return <p className="text-sm text-gray-500">{t('detail.noSimilar')}</p>;
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
      {similarSignals.map((similar) => (
        <Link
          key={similar.id}
          href={`/signals/${similar.id}`}
          className="flex-shrink-0 w-56"
        >
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start gap-2">
              <div className="p-1 rounded bg-teal-100 dark:bg-teal-900/50">
                <RadioIcon className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {similar.title}
                </h4>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${getDomainColor(similar.domain)}`}>
                    {t(`domains.${similar.domain}`)}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {t(`confidence.${similar.confidence}`)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

type SignalLinksCardProps = Readonly<{
  links: ReturnType<typeof useSignalLinks>;
  t: TFn;
}>;

// Linked projects + communities card. Pure render driven by the useSignalLinks hook.
function SignalLinksCard({ links, t }: SignalLinksCardProps) {
  const {
    projectLinks, communityLinks, isLoadingLinks,
    selectedProject, setSelectedProject, selectedCommunity, setSelectedCommunity,
    isLinkingProject, isLinkingCommunity, unlinkingProjectId, unlinkingCommunityId,
    handleLinkProject, handleUnlinkProject, handleLinkCommunity, handleUnlinkCommunity,
  } = links;
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('action.title')}
        </h3>
      </div>

      {isLoadingLinks ? (
        <div className="text-sm text-gray-500">{t('common:loading')}</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('action.linkedProjects')}</h4>
            {projectLinks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('action.noProjects')}</p>
            ) : (
              <div className="space-y-2">
                {projectLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {link.project?.name ?? link.projectId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkProject(link.projectId)}
                      disabled={unlinkingProjectId === link.projectId}
                      aria-label={t('action.unlinkProject', { defaultValue: 'Unlink project' })}
                      className="p-1 h-auto"
                    >
                      <XIcon className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <InitiativeCombobox
                  value={selectedProject}
                  onChange={setSelectedProject}
                  placeholder={t('action.searchProject')}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleLinkProject} disabled={isLinkingProject || !selectedProject} disabledReasonId={!selectedProject ? 'signal-link-project-requirements' : undefined}>
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
            <ActionRequirements id="signal-link-project-requirements" requirements={[!selectedProject ? t('common:actionRequirements.selectProject') : null]} />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('action.linkedCommunities')}</h4>
            {communityLinks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('action.noCommunities')}</p>
            ) : (
              <div className="space-y-2">
                {communityLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {link.community?.name ?? link.communityId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkCommunity(link.communityId)}
                      disabled={unlinkingCommunityId === link.communityId}
                      aria-label={t('action.unlinkCommunity', { defaultValue: 'Unlink community' })}
                      className="p-1 h-auto"
                    >
                      <XIcon className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <CommunityCombobox
                  value={selectedCommunity}
                  onChange={(opt) => {
                    // AUDIT-20260613-023: only allow linking to an existing
                    // community; suppress the combobox "add new" affordance —
                    // a brand-new community has no membership and would fail
                    // server-side link authorization.
                    setSelectedCommunity(opt && !opt.isNew ? opt : null);
                  }}
                  placeholder={t('action.searchCommunity')}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleLinkCommunity} disabled={isLinkingCommunity || !selectedCommunity} disabledReasonId={!selectedCommunity ? 'signal-link-community-requirements' : undefined}>
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
            <ActionRequirements id="signal-link-community-requirements" requirements={[!selectedCommunity ? t('common:actionRequirements.selectCommunity') : null]} />
          </div>
        </div>
      )}
    </Card>
  );
}

// Corroboration form body. Split out of SignalValidationCard so neither exceeds the
// cc budget (S3776). Pure render; identical markup/behavior to the inline form.
function CorroborateForm({
  corroborationEvidence, setCorroborationEvidence,
  corroborationSourceUrl, setCorroborationSourceUrl,
  isCorroborating, handleCorroborate, setShowCorroborationForm, t,
}: Readonly<{
  corroborationEvidence: string;
  setCorroborationEvidence: (v: string) => void;
  corroborationSourceUrl: string;
  setCorroborationSourceUrl: (v: string) => void;
  isCorroborating: boolean;
  handleCorroborate: () => void;
  setShowCorroborationForm: (v: boolean) => void;
  t: TFn;
}>) {
  return (
    <div className="space-y-2 mb-2">
      <textarea
        value={corroborationEvidence}
        onChange={(e) => setCorroborationEvidence(e.target.value)}
        placeholder={t('validation.corroborateEvidencePlaceholder')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        rows={3}
      />
      <input
        type="url"
        value={corroborationSourceUrl}
        onChange={(e) => setCorroborationSourceUrl(e.target.value)}
        placeholder={t('validation.corroborateSourceUrl')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCorroborate}
          disabled={isCorroborating || corroborationEvidence.trim().length < 10}
          disabledReasonId={corroborationEvidence.trim().length < 10 ? 'signal-corroboration-requirements' : undefined}
        >
          {t('validation.corroborateSubmit')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowCorroborationForm(false)}>
          {t('form.cancel')}
        </Button>
      </div>
      <ActionRequirements id="signal-corroboration-requirements" requirements={[corroborationEvidence.trim().length < 10 ? t('common:actionRequirements.enterCorroborationEvidence', { count: 10 }) : null]} />
    </div>
  );
}

// Flag-noise form body. Split out of SignalValidationCard for the same cc reason (S3776).
function FlagForm({
  flagReason, setFlagReason, isFlagging, handleFlagNoise, setShowFlagForm, t,
}: Readonly<{
  flagReason: string;
  setFlagReason: (v: string) => void;
  isFlagging: boolean;
  handleFlagNoise: () => void;
  setShowFlagForm: (v: boolean) => void;
  t: TFn;
}>) {
  return (
    <div className="space-y-2">
      <textarea
        value={flagReason}
        onChange={(e) => setFlagReason(e.target.value)}
        placeholder={t('validation.flagReasonPlaceholder')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          onClick={handleFlagNoise}
          disabled={isFlagging || flagReason.trim().length < 10}
          disabledReasonId={flagReason.trim().length < 10 ? 'signal-flag-requirements' : undefined}
        >
          {t('validation.flagSubmit')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowFlagForm(false)}>
          {t('form.cancel')}
        </Button>
      </div>
      <ActionRequirements id="signal-flag-requirements" requirements={[flagReason.trim().length < 10 ? t('common:actionRequirements.enterFlagReason', { count: 10 }) : null]} />
    </div>
  );
}

type SignalValidationCardProps = Readonly<{
  engagement: ReturnType<typeof useSignalEngagement>;
  t: TFn;
}>;

// Resonate / corroborate / flag card. Pure render driven by the useSignalEngagement hook.
function SignalValidationCard({ engagement, t }: SignalValidationCardProps) {
  const {
    isResonating, isCorroborating, isFlagging, hasResonated,
    corroborationEvidence, setCorroborationEvidence,
    corroborationSourceUrl, setCorroborationSourceUrl,
    flagReason, setFlagReason,
    showCorroborationForm, setShowCorroborationForm,
    showFlagForm, setShowFlagForm,
    handleResonate, handleCorroborate, handleFlagNoise,
  } = engagement;
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('validation.resonate')}</h3>

      <div className="flex gap-2 mb-3">
        <Button
          variant={hasResonated === 'RESONATES' ? 'primary' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => handleResonate('RESONATES')}
          disabled={isResonating || hasResonated !== null}
        >
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          {t('validation.resonate')}
        </Button>
        <Button
          variant={hasResonated === 'DOESNT_RESONATE' ? 'danger' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => handleResonate('DOESNT_RESONATE')}
          disabled={isResonating || hasResonated !== null}
        >
          <XCircleIcon className="h-4 w-4 mr-1" />
          {t('validation.doesntResonate')}
        </Button>
      </div>

      {showCorroborationForm ? (
        <CorroborateForm
          corroborationEvidence={corroborationEvidence}
          setCorroborationEvidence={setCorroborationEvidence}
          corroborationSourceUrl={corroborationSourceUrl}
          setCorroborationSourceUrl={setCorroborationSourceUrl}
          isCorroborating={isCorroborating}
          handleCorroborate={handleCorroborate}
          setShowCorroborationForm={setShowCorroborationForm}
          t={t}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-2"
          onClick={() => setShowCorroborationForm(true)}
        >
          {t('validation.corroborate')}
        </Button>
      )}

      {showFlagForm ? (
        <FlagForm
          flagReason={flagReason}
          setFlagReason={setFlagReason}
          isFlagging={isFlagging}
          handleFlagNoise={handleFlagNoise}
          setShowFlagForm={setShowFlagForm}
          t={t}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowFlagForm(true)}
        >
          <AlertTriangleIcon className="h-4 w-4 mr-1" />
          {t('validation.flagNoise')}
        </Button>
      )}
    </Card>
  );
}

// Edit / delete card. Pure render; the delete-confirm ternary lives here, not in the
// parent, keeping SignalDetail under the cc budget (S3776).
function SignalEditCard({ signalId, showDeleteConfirm, setShowDeleteConfirm, handleDelete, isDeleting, t }: Readonly<{
  signalId: string;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  handleDelete: () => void;
  isDeleting: boolean;
  t: TFn;
}>) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('detail.edit')}</h3>
      <div className="flex flex-col gap-2">
        <Link href={`/signals/${signalId}/edit`}>
          <Button variant="outline" size="sm" className="w-full">
            <PencilIcon className="h-4 w-4 mr-2" />
            {t('detail.edit')}
          </Button>
        </Link>
        {showDeleteConfirm ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-red-600 dark:text-red-400">{t('detail.deleteConfirm')}</p>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t('form.submitting') : t('detail.delete')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              {t('form.cancel')}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
            <TrashIcon className="h-4 w-4 mr-2" />
            {t('detail.delete')}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function SignalDetail({ signal }: Readonly<SignalDetailProps>) {
  const { t } = useTranslation('signals');
  const router = useRouter();

  const engagement = useSignalEngagement(signal, t, router);
  const links = useSignalLinks(signal.id, t);
  const {
    isDeleting, showDeleteConfirm, setShowDeleteConfirm,
    resonatesCount, corroborationCount, isLoadingSimilar, similarSignals, handleDelete,
  } = engagement;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/signals"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('detail.backToSignals')}
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <SignalInfoCard signal={signal} t={t} />

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Link2Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('detail.similarSignals')}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('detail.similarSignalsDescription')}
            </p>

            <SimilarSignalsBody isLoadingSimilar={isLoadingSimilar} similarSignals={similarSignals} t={t} />
          </Card>

          <SignalLinksCard links={links} t={t} />
        </div>

        <div className="lg:w-72 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t(`verification.${signal.verificationLevel}`)}
            </h3>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className={`h-5 w-5 ${getVerificationColor(signal.verificationLevel)}`} />
              <span className="text-sm">{t(`verification.${signal.verificationLevel}`)}</span>
            </div>

            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="font-medium">{resonatesCount}</span>
                <span className="text-gray-500 ml-1">{t('detail.resonances')}</span>
              </div>
              <div>
                <span className="font-medium">{corroborationCount}</span>
                <span className="text-gray-500 ml-1">{t('detail.corroborations')}</span>
              </div>
            </div>
          </Card>

          <SignalValidationCard engagement={engagement} t={t} />

          <SignalEditCard
            signalId={signal.id}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            handleDelete={handleDelete}
            isDeleting={isDeleting}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
