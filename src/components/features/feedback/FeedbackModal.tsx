'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ThumbsUpIcon, ThumbsDownIcon, SendIcon, Loader2Icon, LightbulbIcon } from 'lucide-react';
import { Button, Input, Checkbox, Label } from '@/components/ui';
import { submitFeedback } from '@/app/actions/feedback';
import { submitIdeaPost } from '@/app/actions/idea-post';
import { useAuth } from '@/components/providers/AuthProvider';
import type { IdeaPostType } from '@/lib/prisma-shared';
import { toast } from 'sonner';
import { Z_CLASS } from '@/lib/z-index';

const IDEA_TYPE_OPTIONS: readonly IdeaPostType[] = ['PAIN_POINT', 'FEATURE_IDEA', 'BUG_FIX'];

function buildIdeaDescription(type: 'LIKE' | 'DISLIKE', expectation: string, reality: string, improvement: string): string {
  if (type === 'LIKE') return expectation;
  return [reality, improvement].map((s) => s.trim()).filter(Boolean).join('\n\n') || expectation;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ERROR_MESSAGE_SELECTORS = [
  '[role="alert"]',
  '[aria-live="assertive"]',
  '[data-sonner-toast][data-type="error"]',
  '[data-testid*="error" i]',
  '[class*="error" i]',
];

function getVisibleErrorMessages() {
  const elements = ERROR_MESSAGE_SELECTORS.flatMap((selector) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)),
  );
  const uniqueMessages = new Set<string>();

  elements.forEach((element) => {
    if (element.closest('[data-feedback-modal="true"]')) return;

    const style = globalThis.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const message = (element.innerText || element.textContent || '').trim().replaceAll(/\s+/g, ' ');
    if (message) uniqueMessages.add(message);
  });

  return Array.from(uniqueMessages).slice(0, 10);
}

export function FeedbackModal({ isOpen, onClose }: Readonly<FeedbackModalProps>) {
  const { t, i18n } = useTranslation(['feedback']);
  const { user, isAuthenticated } = useAuth();
  const isRegistered = isAuthenticated && !!user && user.profileType !== 'GUEST';
  const [type, setType] = useState<'LIKE' | 'DISLIKE'>('LIKE');
  const [expectation, setExpectation] = useState('');
  const [reality, setReality] = useState('');
  const [improvement, setImprovement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishAsIdea, setPublishAsIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaType, setIdeaType] = useState<IdeaPostType>('FEATURE_IDEA');

  const maybePublishIdea = async (feedbackId: string) => {
    const result = await submitIdeaPost({
      feedbackId,
      title: ideaTitle.trim(),
      description: buildIdeaDescription(type, expectation, reality, improvement),
      type: ideaType,
      tags: [],
      rdgTags: [],
    });
    if (result.success) toast.success(t('publishAsIdea.success', 'Published to the community board.'));
    else toast.error(result.error || t('publishAsIdea.failed', 'Could not publish to the community board.'));
  };

  const validateFeedbackForm = (trimmedExpectation: string, trimmedReality: string): string | null => {
    if (type === 'LIKE' && !trimmedExpectation) return t('validation.like', 'Please tell us what you liked.');
    if (type === 'DISLIKE' && (!trimmedExpectation || !trimmedReality)) return t('validation.dislike', 'Please tell us what you expected and what happened.');
    if (publishAsIdea && isRegistered && !ideaTitle.trim()) return t('publishAsIdea.titleRequired', 'Please add a short title for your idea.');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedExpectation = expectation.trim();
    const trimmedReality = reality.trim();

    const validationError = validateFeedbackForm(trimmedExpectation, trimmedReality);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata = {
        language: i18n.language,
        userAgent: navigator.userAgent,
        url: globalThis.location.href,
        route: globalThis.location.pathname,
        search: globalThis.location.search,
        hash: globalThis.location.hash,
        visibleErrorMessages: getVisibleErrorMessages(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      };

      const result = await submitFeedback({
        type,
        expectation: trimmedExpectation,
        reality: type === 'LIKE' ? trimmedExpectation : trimmedReality,
        improvement: type === 'DISLIKE' ? improvement.trim() : undefined,
        metadata,
      });

      if (result.success) {
        toast.success(t('success', 'Feedback sent! Thank you.'));
        const feedbackId = 'id' in result ? result.id : undefined;
        if (publishAsIdea && isRegistered && feedbackId) {
          await maybePublishIdea(feedbackId);
        }
        onClose();
        // Reset form
        setExpectation('');
        setReality('');
        setImprovement('');
        setPublishAsIdea(false);
        setIdeaTitle('');
      } else {
        toast.error(result.error || t('error', 'Something went wrong'));
      }
    } catch (_error) {
      toast.error(t('failed', 'Failed to submit feedback'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div data-feedback-modal="true" className={`fixed inset-0 ${Z_CLASS.feedbackModal} flex items-center justify-center p-4 sm:p-6`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {t('title', 'Share your feedback')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Like / Dislike Toggle */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('LIKE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    type === 'LIKE'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUpIcon className={`w-5 h-5 ${type === 'LIKE' ? 'fill-emerald-500' : ''}`} />
                  <span className="font-semibold text-sm">{t('like', 'I like it')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('DISLIKE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    type === 'DISLIKE'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsDownIcon className={`w-5 h-5 ${type === 'DISLIKE' ? 'fill-red-500' : ''}`} />
                  <span className="font-semibold text-sm">{t('dislike', 'I don\'t like it')}</span>
                </button>
              </div>

              {/* Mandatory Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="feedback-expectation" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {type === 'LIKE' ? t('whatLiked', 'What did you like?') : t('whatExpected', 'What did you expect?')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-expectation"
                    required
                    value={expectation}
                    onChange={(e) => setExpectation(e.target.value)}
                    placeholder={
                      type === 'LIKE'
                        ? t('placeholders.like', 'e.g. The map made it easy to find nearby groups...')
                        : t('placeholders.dislike', 'e.g. I wanted to filter by region...')
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px] text-sm"
                  />
                </div>

                {type === 'DISLIKE' && (
                  <div>
                    <label htmlFor="feedback-reality" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('whatHappened', 'What actually happened?')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="feedback-reality"
                      required
                      value={reality}
                      onChange={(e) => setReality(e.target.value)}
                      placeholder={t('placeholders.reality', 'e.g. The map didn\'t update after I clicked...')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px] text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Optional Fields */}
              {type === 'DISLIKE' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <label htmlFor="feedback-improvement" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('improvement', 'What could be better?')}
                    </label>
                    <textarea
                      id="feedback-improvement"
                      value={improvement}
                      onChange={(e) => setImprovement(e.target.value)}
                      placeholder={t('placeholders.improvement', 'Your suggestions...')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              )}

              {isRegistered && (
                <div className="space-y-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={publishAsIdea}
                      onCheckedChange={(checked) => setPublishAsIdea(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <LightbulbIcon className="w-4 h-4 text-emerald-500" />
                      {t('publishAsIdea.label', 'Also publish this as a public idea on the roadmap')}
                    </span>
                  </label>

                  {publishAsIdea && (
                    <div className="space-y-3 pl-7">
                      <p className="text-xs text-gray-500">{t('publishAsIdea.hint', 'Others can upvote and comment on it. Your feedback details stay private.')}</p>
                      <div>
                        <Label htmlFor="idea-title">{t('publishAsIdea.titleLabel', 'Idea title')}</Label>
                        <Input
                          id="idea-title"
                          value={ideaTitle}
                          onChange={(e) => setIdeaTitle(e.target.value)}
                          placeholder={t('publishAsIdea.titlePlaceholder', 'A short, clear title')}
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="idea-type">{t('publishAsIdea.typeLabel', 'Category')}</Label>
                        <select
                          id="idea-type"
                          value={ideaType}
                          onChange={(e) => setIdeaType(e.target.value as IdeaPostType)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm"
                        >
                          {IDEA_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{t(`publishAsIdea.types.${opt}`, opt)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
                      {t('sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-5 h-5 mr-2" />
                      {t('submit', 'Send Feedback')}
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-4">
                  {t('privacyNote', 'We automatically capture your browser version and system info to help us troubleshoot.')}
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
