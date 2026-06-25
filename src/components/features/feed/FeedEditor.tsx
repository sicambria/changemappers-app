'use client';

import { useFeedEditor, MentionUser } from '@/lib/feed-editor';
import { EditorContent } from '@tiptap/react';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button } from '@/components/ui';
import { useState, useCallback } from 'react';
import { searchUsersForMentionAction } from '@/app/actions/feed';
import { Image as ImageIcon, Link as LinkIcon, VideoIcon } from 'lucide-react';
import { detectVideoUrl, PLATFORM_LABELS } from '@/lib/video-platforms';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface FeedEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  onSubmit?: (content: string) => void | boolean | Promise<void | boolean>;
  submitLabel?: string;
  showSubmit?: boolean;
  className?: string;
}

const SUPPORTED_PLATFORMS = Object.values(PLATFORM_LABELS).join(', ');

export function FeedEditor({
  initialContent: _initialContent = '',
  placeholder,
  onChange,
  onSubmit,
  submitLabel,
  showSubmit = true,
  className = '',
}: Readonly<FeedEditorProps>) {
  const { t } = useTranslation('feed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const handleMentionSearch = useCallback(async (query: string): Promise<MentionUser[]> => {
    const result = await searchUsersForMentionAction(query, 5);
    if (result.success && result.data) return result.data.users;
    return [];
  }, []);

  const editor = useFeedEditor({
    placeholder,
    onMentionSearch: handleMentionSearch,
    onUpdate: (e) => {
      onChange?.(e.getHTML());
      // isEmpty is false when any non-empty node exists (text, videoEmbed, image…)
      setHasContent(!e.isEmpty);
    },
  });

  const handleSubmit = async () => {
    if (!editor || !onSubmit) return;
    const content = editor.getHTML();
    if (!content || content === '<p></p>') return;

    setIsSubmitting(true);
    try {
      // Clear the composed draft only when the submit did not explicitly fail.
      // A `false` return signals failure (e.g. post creation rejected); a `void`/
      // `undefined` return preserves the legacy success contract.
      const result = await onSubmit(content);
      if (result !== false) {
        editor.commands.clearContent();
        setHasContent(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImage = () => {
    const url = globalThis.prompt(t('editor.imageUrlPrompt'));
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = globalThis.prompt(t('editor.linkUrlPrompt'));
    if (url && editor) editor.chain().focus().setLink({ href: url }).run();
  };

  const addVideo = () => {
  const url = globalThis.prompt(
    t('editor.videoUrlPrompt', { platforms: SUPPORTED_PLATFORMS })
  );
    if (!url || !editor) return;
    const detected = detectVideoUrl(url.trim());
    if (!detected) {
      toast.error(t('editor.videoUrlNotRecognised', { platforms: SUPPORTED_PLATFORMS }));
      return;
    }
    editor.commands.setVideoEmbed({ src: detected.embedUrl, platform: detected.platform });
  };

  const submitRequirementsId = 'feed-editor-submit-requirements';
  const submitRequirements = [!hasContent ? t('common:actionRequirements.enterPostContent') : null];

  if (!editor) return null;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('bold')
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
          title={t('editor.bold')}
        >
          <span className="font-bold text-sm">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('italic')
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
          title={t('editor.italic')}
        >
          <span className="italic text-sm">I</span>
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={addLink}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('link')
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
          title={t('editor.addLink')}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
          title={t('editor.addImage')}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addVideo}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
          title={t('editor.embedVideo', { platforms: SUPPORTED_PLATFORMS })}
        >
          <VideoIcon className="w-4 h-4" />
        </button>
      </div>

      <div data-testid="post-creator-editor" className="min-h-[120px] max-h-[400px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {showSubmit && (
        <div className="space-y-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <ActionRequirements id={submitRequirementsId} requirements={submitRequirements} />
          <div className="flex justify-end">
          <Button
            data-testid="post-creator-submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasContent}
            disabledReasonId={submitRequirements.some(Boolean) ? submitRequirementsId : undefined}
            className="px-6"
          >
            {isSubmitting ? t('editor.posting') : (submitLabel ?? t('post.submit'))}
          </Button>
          </div>
        </div>
      )}
    </div>
  );
}
