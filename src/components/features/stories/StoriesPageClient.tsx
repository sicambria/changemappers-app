'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { hu } from 'date-fns/locale/hu';
import { es } from 'date-fns/locale/es';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Pencil,
  TriangleAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
  addStoryCommentAction,
  createStoryAction,
  updateStoryAction,
} from '@/app/actions/stories';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { StoryTypeValues, type StoryView } from '@/types/stories';

type StoryFormState = {
  storyType: keyof typeof StoryTypeValues;
  title: string;
  summary: string;
  context: string;
  challenge: string;
  whatHappened: string;
  outcome: string;
  lessonsLearned: string;
  retrospectiveWhatWorked: string;
  retrospectiveWhatToChange: string;
  retrospectiveAdvice: string;
  acknowledgeNoDeletion: boolean;
  acknowledgeLicense: boolean;
};

const EMPTY_FORM: StoryFormState = {
  storyType: StoryTypeValues.SUCCESS,
  title: '',
  summary: '',
  context: '',
  challenge: '',
  whatHappened: '',
  outcome: '',
  lessonsLearned: '',
  retrospectiveWhatWorked: '',
  retrospectiveWhatToChange: '',
  retrospectiveAdvice: '',
  acknowledgeNoDeletion: false,
  acknowledgeLicense: false,
};

function getTypeClasses(storyType: StoryView['storyType']) {
  return storyType === StoryTypeValues.SUCCESS
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-amber-100 text-amber-900 border-amber-200';
}

function formatDate(date: string, language: string) {
  return new Date(date).toLocaleDateString(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getDateFnsLocale(lang: string) {
  if (lang === 'hu') return hu;
  if (lang === 'es') return es;
  return enUS;
}

function toEditableForm(story: StoryView): StoryFormState {
  return {
    storyType: story.storyType,
    title: story.title,
    summary: story.summary,
    context: story.context,
    challenge: story.challenge,
    whatHappened: story.whatHappened,
    outcome: story.outcome,
    lessonsLearned: story.lessonsLearned,
    retrospectiveWhatWorked: story.retrospectiveWhatWorked ?? '',
    retrospectiveWhatToChange: story.retrospectiveWhatToChange ?? '',
    retrospectiveAdvice: story.retrospectiveAdvice ?? '',
    acknowledgeNoDeletion: true,
    acknowledgeLicense: true,
  };
}

export default function StoriesPageClient({
  initialStories = [],
  currentUserId = null,
  currentUserName = null,
}: Readonly<{
  initialStories?: StoryView[];
  currentUserId?: string | null;
  currentUserName?: string | null;
}>) {
  const { t } = useTranslation('stories');
  const { language } = useLanguage();
  const [stories, setStories] = useState(initialStories);
  const [form, setForm] = useState<StoryFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentErrorByStory, setCommentErrorByStory] = useState<Record<string, string | null>>({});
  const [submittingCommentStoryId, setSubmittingCommentStoryId] = useState<string | null>(null);
  const { formError, setErrors, clearErrors, getFieldError, clearFieldError } = useValidationErrors();

  const isAuthenticated = Boolean(currentUserId);

  function updateField<K extends keyof StoryFormState>(key: K, value: StoryFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  }

  function resetComposer() {
    setForm(EMPTY_FORM);
    setEditingStoryId(null);
    clearErrors();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();
    setIsSubmitting(true);

    const payload = {
      storyType: form.storyType,
      title: form.title,
      summary: form.summary,
      context: form.context,
      challenge: form.challenge,
      whatHappened: form.whatHappened,
      outcome: form.outcome,
      lessonsLearned: form.lessonsLearned,
      retrospectiveWhatWorked: form.retrospectiveWhatWorked,
      retrospectiveWhatToChange: form.retrospectiveWhatToChange,
      retrospectiveAdvice: form.retrospectiveAdvice,
      acknowledgeNoDeletion: form.acknowledgeNoDeletion,
      acknowledgeLicense: form.acknowledgeLicense,
    };

    const result = editingStoryId
      ? await updateStoryAction(editingStoryId, payload)
      : await createStoryAction(payload);

    setIsSubmitting(false);

    if (!result.success) {
      setErrors(result);
      return;
    }

    clearErrors();

    if (editingStoryId) {
      setStories((prev) => prev.map((story) => (story.id === result.data.id ? result.data : story)));
    } else {
      setStories((prev) => [result.data, ...prev]);
    }

    resetComposer();
  }

  function startEditing(story: StoryView) {
    setEditingStoryId(story.id);
    setForm(toEditableForm(story));
    clearErrors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitComment(storyId: string) {
    const content = (commentDrafts[storyId] ?? '').trim();
    setCommentErrorByStory((prev) => ({ ...prev, [storyId]: null }));

    if (content.length < 3) {
      setCommentErrorByStory((prev) => ({ ...prev, [storyId]: t('errors.commentTooShort') }));
      return;
    }

    setSubmittingCommentStoryId(storyId);
    const result = await addStoryCommentAction({ storyId, content });
    setSubmittingCommentStoryId(null);

    if (!result.success) {
      setCommentErrorByStory((prev) => ({
        ...prev,
        [storyId]: result.error ?? t('errors.commentFailed'),
      }));
      return;
    }

    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? { ...story, comments: [...story.comments, result.data.comment] }
          : story,
      ),
    );
    setCommentDrafts((prev) => ({ ...prev, [storyId]: '' }));
  }

  const formFields: [keyof StoryFormState, string, string][] = [
    ['title', t('form.fields.title'), t('form.fields.titleHint')],
    ['summary', t('form.fields.summary'), t('form.fields.summaryHint')],
    ['context', t('form.fields.context'), t('form.fields.contextHint')],
    ['challenge', t('form.fields.challenge'), t('form.fields.challengeHint')],
    ['whatHappened', t('form.fields.whatHappened'), t('form.fields.whatHappenedHint')],
    ['outcome', t('form.fields.outcome'), t('form.fields.outcomeHint')],
    ['lessonsLearned', t('form.fields.lessonsLearned'), t('form.fields.lessonsLearnedHint')],
  ];

  const retroFields: [keyof StoryFormState, string][] = [
    ['retrospectiveWhatWorked', t('form.retrospective.whatWorked')],
    ['retrospectiveWhatToChange', t('form.retrospective.whatToChange')],
    ['retrospectiveAdvice', t('form.retrospective.advice')],
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc,_#ffffff)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToHome')}
          </Link>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
            <BookOpen className="h-4 w-4" />
            {t('badge')}
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {t('heading')}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {t('commons')}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
          <section className="space-y-4">
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{t('beforePublish.title')}</p>
                  <p className="mt-1 leading-6">
                    {t('beforePublish.noDeletion')} <strong>CC-BY-SA 4.0</strong>.
                  </p>
                </div>
              </div>
              <p className="leading-6">{t('beforePublish.useDetail')}</p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-950">
                  {editingStoryId ? t('form.editTitle') : t('form.shareTitle')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isAuthenticated
                    ? t('form.publishingAs', { name: currentUserName ?? '' })
                    : t('form.signInPrompt')}
                </p>
              </div>

              {isAuthenticated ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {formError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">{t('form.storyTypeLabel')}</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { value: StoryTypeValues.SUCCESS, label: t('form.successLabel'), hint: t('form.successHint') },
                        { value: StoryTypeValues.FAILURE, label: t('form.failureLabel'), hint: t('form.failureHint') },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('storyType', option.value)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            form.storyType === option.value
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className={`mt-1 text-sm ${form.storyType === option.value ? 'text-slate-200' : 'text-slate-500'}`}>
                            {option.hint}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formFields.map(([field, label, hint]) => (
                    <div key={field}>
                      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                      <p className="mb-2 text-xs text-slate-500">{hint}</p>
                      {field === 'title' ? (
                        <input
                          value={form.title}
                          onChange={(event) => updateField('title', event.target.value)}
                          className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                            getFieldError(field) ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-slate-400'
                          }`}
                        />
                      ) : (
                        <textarea
                          value={form[field] as string}
                          onChange={(event) => updateField(field, event.target.value)}
                          rows={field === 'summary' ? 3 : 5}
                          className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                            getFieldError(field) ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-slate-400'
                          }`}
                        />
                      )}
                      {getFieldError(field) && <p className="mt-1 text-sm text-red-600">{getFieldError(field)}</p>}
                    </div>
                  ))}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">{t('form.retrospective.title')}</h3>
                    <p className="mt-1 text-xs text-slate-500">{t('form.retrospective.hint')}</p>
                    <div className="mt-4 space-y-4">
                      {retroFields.map(([field, label]) => (
                        <div key={field}>
                          <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                          <textarea
                            value={form[field] as string}
                            onChange={(event) => updateField(field, event.target.value)}
                            rows={3}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {!editingStoryId && (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.acknowledgeNoDeletion}
                          onChange={(event) => updateField('acknowledgeNoDeletion', event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                        <span>{t('form.acknowledgements.noDeletion')}</span>
                      </label>
                      {getFieldError('acknowledgeNoDeletion') && (
                        <p className="text-sm text-red-600">{getFieldError('acknowledgeNoDeletion')}</p>
                      )}

                      <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.acknowledgeLicense}
                          onChange={(event) => updateField('acknowledgeLicense', event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                        <span>{t('form.acknowledgements.license')}</span>
                      </label>
                      {getFieldError('acknowledgeLicense') && (
                        <p className="text-sm text-red-600">{getFieldError('acknowledgeLicense')}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {editingStoryId ? <Pencil className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {(() => {
                        if (isSubmitting) return t('form.saving');
                        if (editingStoryId) return t('form.save');
                        return t('form.submit');
                      })()}
                    </button>
                    {editingStoryId && (
                      <button
                        type="button"
                        onClick={resetComposer}
                        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {t('form.cancelEdit')}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                  <p className="mb-3">{t('form.browseWithoutLogin')}</p>
                  <Link
                    href="/login?redirect=%2Fstories"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
                  >
                    {t('form.signIn')}
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{t('published.title')}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('published.count', { count: stories.length })}
                </p>
              </div>
            </div>

            {stories.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                {t('published.empty')}
              </div>
            ) : (
              stories.map((story) => (
                <article key={story.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTypeClasses(story.storyType)}`}>
                          {t(`typeLabels.${story.storyType}`)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          <Clock3 className="h-3.5 w-3.5" />
                          {t('published.publishedOn', { date: formatDate(story.publishedAt, language) })}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-950">{story.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {t('published.by', { name: story.authorName })} · {t('published.updated', { time: formatDistanceToNowStrict(new Date(story.updatedAt), { addSuffix: true, locale: getDateFnsLocale(language) }) })}
                      </p>
                    </div>

                    {story.canEdit && (
                      <button
                        type="button"
                        onClick={() => startEditing(story)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        {t('published.edit')}
                      </button>
                    )}
                  </div>

                  {story.isOwner && !story.canEdit && (
                    <div className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t('published.editingClosed', { date: formatDate(story.editDeadline, language) })}</span>
                    </div>
                  )}

                  <div className="mt-6 grid gap-5">
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sections.summary')}</h4>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{story.summary}</p>
                    </section>

                    <div className="grid gap-5 md:grid-cols-2">
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sections.context')}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{story.context}</p>
                      </section>
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sections.challenge')}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{story.challenge}</p>
                      </section>
                    </div>

                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sections.whatHappened')}</h4>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{story.whatHappened}</p>
                    </section>

                    <div className="grid gap-5 md:grid-cols-2">
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sections.outcome')}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{story.outcome}</p>
                      </section>
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sections.lessonsLearned')}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{story.lessonsLearned}</p>
                      </section>
                    </div>

                    {(story.retrospectiveWhatWorked || story.retrospectiveWhatToChange || story.retrospectiveAdvice) && (
                      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {t('sections.miniRetrospective')}
                        </h4>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          {story.retrospectiveWhatWorked && (
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{t('sections.whatWorked')}</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {story.retrospectiveWhatWorked}
                              </p>
                            </div>
                          )}
                          {story.retrospectiveWhatToChange && (
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{t('sections.whatToChange')}</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {story.retrospectiveWhatToChange}
                              </p>
                            </div>
                          )}
                          {story.retrospectiveAdvice && (
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{t('sections.adviceForOthers')}</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {story.retrospectiveAdvice}
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-white p-0">
                      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                        <MessageSquare className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {t('comments.title')}
                        </h4>
                      </div>
                      <div className="space-y-4 p-5">
                        {story.comments.length === 0 ? (
                          <p className="text-sm text-slate-500">{t('comments.empty')}</p>
                        ) : (
                          story.comments.map((comment) => (
                            <div key={comment.id} className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">
                                {comment.authorName}{' '}
                                <span className="font-normal text-slate-500">
                                  · {formatDate(comment.createdAt, language)}
                                </span>
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {comment.content}
                              </p>
                            </div>
                          ))
                        )}

                        {story.isOwner && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              {t('comments.addLabel')}
                            </label>
                            <textarea
                              value={commentDrafts[story.id] ?? ''}
                              onChange={(event) =>
                                setCommentDrafts((prev) => ({ ...prev, [story.id]: event.target.value }))
                              }
                              rows={3}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                              placeholder={t('comments.placeholder')}
                            />
                            {commentErrorByStory[story.id] && (
                              <p className="mt-2 text-sm text-red-600">{commentErrorByStory[story.id]}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => submitComment(story.id)}
                              disabled={submittingCommentStoryId === story.id}
                              className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {submittingCommentStoryId === story.id ? t('comments.posting') : t('comments.submit')}
                            </button>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
