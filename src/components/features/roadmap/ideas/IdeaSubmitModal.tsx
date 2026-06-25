'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Textarea, Label } from '@/components/ui';
import { Z_CLASS } from '@/lib/z-index';
import { submitIdeaPost } from '@/app/actions/idea-post';
import { IDEA_LIMITS } from '@/lib/validations/idea-post';
import type { IdeaPostType } from '@/lib/prisma-shared';
import { IdeaRdgPicker } from './IdeaRdgPicker';
import { IDEA_TYPES, IDEA_TYPE_ACCENT } from './types';

interface IdeaSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function TypeSelect({ value, onChange }: Readonly<{ value: IdeaPostType; onChange: (t: IdeaPostType) => void }>) {
  const { t } = useTranslation('roadmap');
  return (
    <div className="flex flex-wrap gap-2">
      {IDEA_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
            value === type ? IDEA_TYPE_ACCENT[type] + ' ring-2 ring-current' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}
        >
          {t(`ideas.types.${type}`)}
        </button>
      ))}
    </div>
  );
}

export function IdeaSubmitModal({ isOpen, onClose, onCreated }: Readonly<IdeaSubmitModalProps>) {
  const { t } = useTranslation('roadmap');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IdeaPostType>('FEATURE_IDEA');
  const [tagsText, setTagsText] = useState('');
  const [rdgTags, setRdgTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const tags = tagsText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, IDEA_LIMITS.maxTags);
    const result = await submitIdeaPost({ title: title.trim(), description: description.trim(), type, tags, rdgTags });
    if (result.success) {
      toast.success(t('ideas.submit.success'));
      setTitle(''); setDescription(''); setTagsText(''); setRdgTags([]);
      onCreated();
      onClose();
    } else {
      toast.error(result.error || t('ideas.submit.failed'));
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`fixed inset-0 ${Z_CLASS.feedbackModal} flex items-center justify-center p-4`}>
      <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('ideas.submit.title')}</h2>
          <button onClick={onClose} aria-label={t('ideas.submit.close')} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-6">
          <div>
            <Label htmlFor="idea-title">{t('ideas.submit.titleLabel')}</Label>
            <Input id="idea-title" required maxLength={IDEA_LIMITS.title} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ideas.submit.titlePlaceholder')} />
          </div>
          <div>
            <Label htmlFor="idea-description">{t('ideas.submit.descriptionLabel')}</Label>
            <Textarea id="idea-description" required maxLength={IDEA_LIMITS.description} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('ideas.submit.descriptionPlaceholder')} className="min-h-[100px]" />
          </div>
          <div>
            <Label>{t('ideas.submit.typeLabel')}</Label>
            <TypeSelect value={type} onChange={setType} />
          </div>
          <div>
            <Label>{t('ideas.submit.rdgLabel')}</Label>
            <IdeaRdgPicker value={rdgTags} onChange={setRdgTags} max={IDEA_LIMITS.maxRdgTags} />
          </div>
          <div>
            <Label htmlFor="idea-tags">{t('ideas.submit.tagsLabel')}</Label>
            <Input id="idea-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder={t('ideas.submit.tagsPlaceholder')} />
            <p className="mt-1 text-xs text-gray-400">{t('ideas.submit.tagsHint')}</p>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <SendIcon className="mr-2 h-4 w-4" />}
            {isSubmitting ? t('ideas.submit.submitting') : t('ideas.submit.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
