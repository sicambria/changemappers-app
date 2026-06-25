'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarImage, AvatarFallback, Modal } from '@/components/ui';
import { createPostAction } from '@/app/actions/feed';
import { PostSource, PostVisibility } from '@/types/feed';
import { extractVideoUrlsFromContent } from '@/lib/video-platforms';
import { useAuth } from '@/components/providers/AuthProvider';
import { LockIcon, GlobeIcon, UsersIcon, ChevronDownIcon, UserIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CommonsLicenseNotice } from '@/components/shared/CommonsLicenseNotice';
import { FeedAnnotationPicker } from './FeedAnnotationPicker';

// The TipTap/ProseMirror editor stack is heavy (~150 KB+ min+gzip) and only
// needed once the compose modal opens — load it on demand instead of shipping
// it in the /feed first-load JS (AUDIT-20260613-014). Matches the project's
// dynamic-import pattern for leaflet/excalidraw/globe/calendar. ssr: false —
// the editor is client-only (TipTap requires the DOM).
const FeedEditor = dynamic(
  () => import('./FeedEditor').then((mod) => mod.FeedEditor),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="post-creator-editor-loading"
        aria-hidden="true"
        className="min-h-[120px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
      />
    ),
  },
);

interface PostCreatorProps {
  communityId?: string;
  onSuccess?: (slug: string) => void;
}

export function PostCreator({ communityId, onSuccess }: Readonly<PostCreatorProps>) {
  const { t } = useTranslation(['feed', 'common']);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);
  const [sourceType] = useState<PostSource>(PostSource.USER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const [rdgSlugs, setRdgSlugs] = useState<string[]>([]);
  const [tagKeys, setTagKeys] = useState<string[]>([]);
  // Lock background scroll while the composer modal is open. Escape-to-close,
  // focus trap, and focus restoration are handled by the shared Modal primitive.
  useEffect(() => {
    if (!isModalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleSubmit = async (content: string) => {
    if (!user || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const youtubeLinks = extractVideoUrlsFromContent(content);
      const data = {
        content,
        sourceType,
        visibility,
        communityId,
        youtubeLinks: youtubeLinks.length > 0 ? youtubeLinks : undefined,
        rdgSlugs,
        tagKeys,
      };
      const result = await createPostAction(data);
      if (result.success && result.data) {
        toast.success(t('post.createSuccess'));
        setIsModalOpen(false);
        setShowVisibility(false);
        setRdgSlugs([]);
        setTagKeys([]);
        onSuccess?.(result.data.slug);
        return true;
      }
      toast.error(result.error || t('errors.createFailed'));
      // Signal failure so FeedEditor preserves the composed draft.
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-gray-400" />
        </div>
        <a href="/login" className="flex-1 text-sm text-gray-400 hover:text-emerald-600 transition-colors">
          {t('comments.loginPrompt')}
        </a>
      </div>
    );
  }

  const visibilityConfig = {
    [PostVisibility.PUBLIC]: { icon: <GlobeIcon className="w-3.5 h-3.5" />, label: t('post.visibilityPublic') },
    [PostVisibility.REGISTERED]: { icon: <UsersIcon className="w-3.5 h-3.5" />, label: t('post.visibilityRegistered') },
    [PostVisibility.INTERNAL]: { icon: <LockIcon className="w-3.5 h-3.5" />, label: t('post.visibilityInternal') },
  };

  return (
    <>
      {/* ── Thin trigger bar ── */}
      <button
        type="button"
        data-testid="post-creator-trigger"
        aria-label={t('post.composerDialogLabel', 'Create a post')}
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-emerald-400 dark:hover:border-emerald-600"
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          {user.profilePhoto && (
            <AvatarImage src={user.profilePhoto} alt={user.displayName || user.name} />
          )}
          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs">
            <UserIcon className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 text-sm text-gray-400 dark:text-gray-500 select-none">
          {t('post.inspirationPlaceholder', 'What inspires you today?')}
        </span>
      </button>

      {/* ── Full editor modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ariaLabel={t('post.composerDialogLabel', 'Create a post')}
        data-testid="post-creator-modal"
        className="max-w-2xl"
      >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  {user.profilePhoto && (
                    <AvatarImage src={user.profilePhoto} alt={user.displayName || user.name} />
                  )}
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                    <UserIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                    {user.displayName || user.name}
                  </p>
                  {/* Visibility selector */}
                  <div className="relative mt-1">
                    <button
                      data-testid="post-visibility-toggle"
                      onClick={() => setShowVisibility(!showVisibility)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {visibilityConfig[visibility].icon}
                      {visibilityConfig[visibility].label}
                      <ChevronDownIcon className={`w-3 h-3 transition-transform ${showVisibility ? 'rotate-180' : ''}`} />
                    </button>
                    {showVisibility && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                        {(Object.values(PostVisibility) as PostVisibility[]).map((v) => (
                          <button
                            key={v}
                            data-testid={`visibility-option-${v}`}
                            onClick={() => { setVisibility(v); setShowVisibility(false); }}
                            className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              visibility === v ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {visibilityConfig[v].icon}
                            {visibilityConfig[v].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label={t('common:actions.close')}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[200px] space-y-4">
              <CommonsLicenseNotice />
              <FeedAnnotationPicker
                rdgSlugs={rdgSlugs}
                tagKeys={tagKeys}
                onRdgSlugsChange={setRdgSlugs}
                onTagKeysChange={setTagKeys}
                compact
              />
              <FeedEditor
                placeholder={t('post.placeholder', 'Share something with the community...')}
                onSubmit={handleSubmit}
                submitLabel={isSubmitting ? t('common:loading', 'Posting...') : t('post.submit', 'Post')}
              />
            </div>
          </div>
      </Modal>
    </>
  );
}
