'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, InfoIcon, RotateCcwIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setOnboardingJourneyStepDoneAction } from '@/app/actions/onboarding-journey';
import {
  ONBOARDING_JOURNEY_STEPS,
  getOnboardingJourneyProgress,
  type OnboardingJourneyStepId,
} from '@/lib/onboarding-journey';
import { Z_CLASS } from '@/lib/z-index';

type Props = {
  initialCompletedStepIds: string[];
  userName: string;
};

function computeCompletedStepIds(current: string[], stepId: string, done: boolean): string[] {
  const next = new Set(current);
  if (done) next.add(stepId);
  else next.delete(stepId);
  return ONBOARDING_JOURNEY_STEPS.filter((step) => next.has(step.id)).map((step) => step.id);
}

export function OnboardingJourneyClient({ initialCompletedStepIds, userName }: Readonly<Props>) {
  const { t } = useTranslation('onboardingJourney');
  const [completedStepIds, setCompletedStepIds] = useState(initialCompletedStepIds);
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<OnboardingJourneyStepId | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const progress = useMemo(
    () => getOnboardingJourneyProgress(completedStepIds),
    [completedStepIds],
  );
  const completedSet = useMemo(() => new Set(completedStepIds), [completedStepIds]);
  const nextStep = progress.nextStep;
  const firstName = userName.split(' ')[0] || userName;
  const activeStep = useMemo(
    () => ONBOARDING_JOURNEY_STEPS.find((step) => step.id === activeStepId) ?? null,
    [activeStepId],
  );

  useEffect(() => {
    try {
      const stored = globalThis.localStorage.getItem('changemappers:onboarding-journey-drafts');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        setDraftNotes(parsed);
      }
    } catch {
      setDraftNotes({});
    }
  }, []);

  useEffect(() => {
    if (!activeStepId) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveStepId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeStepId]);

  const setDraftNote = (stepId: OnboardingJourneyStepId, value: string) => {
    setDraftNotes((current) => {
      const next = { ...current, [stepId]: value };
      try {
        globalThis.localStorage.setItem('changemappers:onboarding-journey-drafts', JSON.stringify(next));
      } catch {
        // Local draft persistence is best-effort.
      }
      return next;
    });
  };

  const setDone = (stepId: OnboardingJourneyStepId, done: boolean) => {
    setSaveError(null);
    setPendingStepId(stepId);

    startTransition(async () => {
      const result = await setOnboardingJourneyStepDoneAction(stepId, done);
      if (!result.success) {
        setSaveError(result.error ?? t('errors.saveFailed'));
        setPendingStepId(null);
        return;
      }

      setCompletedStepIds((current) => computeCompletedStepIds(current, stepId, done));
      setPendingStepId(null);
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {t('eyebrow')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {t('title', { name: firstName })}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {t('intro')}
            </p>
          </div>

          <div className="w-full max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-emerald-900">{t('progressLabel')}</span>
              <span className="text-2xl font-bold text-emerald-800">{progress.percentage}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-emerald-900">
              {t('progressSummary', {
                completed: progress.completedCount,
                total: progress.totalSteps,
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">{t('pace.title')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('pace.body')}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">{t('next.title')}</h2>
            {nextStep ? (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t(`steps.${nextStep.id}.title`)}
                </p>
                <Link
                  href={nextStep.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {t(`actions.${nextStep.actionKey}`)}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="h-5 w-5 text-emerald-600" />
                  <p className="text-base font-semibold text-emerald-900">{t('completion.title')}</p>
                </div>
                <p className="text-sm leading-6 text-slate-600">{t('completion.subtitle')}</p>
                <Link
                  href="/map"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {t('completion.cta')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <ol className="mt-6 space-y-4">
          {ONBOARDING_JOURNEY_STEPS.map((step, index) => {
            const isDone = completedSet.has(step.id);
            const isStepPending = isPending && pendingStepId === step.id;

            return (
              <li
                key={step.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                data-testid={`onboarding-journey-step-${step.id}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isDone ? <CheckIcon className="h-5 w-5" /> : index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">
                          {t(`steps.${step.id}.title`)}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {isDone ? t('status.done') : t('status.open')}
                        </span>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {t(`steps.${step.id}.body`)}
                      </p>
                      <p className="mt-3 text-sm font-medium text-slate-800">
                        {t(`steps.${step.id}.practice`)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    <button
                      type="button"
                      onClick={() => setActiveStepId(step.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                    >
                      <InfoIcon className="h-4 w-4" />
                      {t('actions.moreInfo')}
                    </button>
                    <Link
                      href={step.href}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      {t(`actions.${step.actionKey}`)}
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      disabled={isStepPending}
                      onClick={() => setDone(step.id, !isDone)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isDone ? <RotateCcwIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                      {isDone ? t('actions.reopen') : t('actions.markDone')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {activeStep && (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
          className={`fixed inset-0 ${Z_CLASS.profileModal} flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveStepId(null);
            }
          }}
        >
          <section // NOSONAR(S6819) — role="dialog"+aria-modal kept; native dialog relies on showModal()/close() which jsdom does not implement, breaking modal tests — focus/Esc handled in JS
            role="dialog"
            aria-modal="true"
            aria-labelledby={`onboarding-modal-title-${activeStep.id}`}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {t('modal.eyebrow')}
                </p>
                <h2 id={`onboarding-modal-title-${activeStep.id}`} className="mt-1 text-2xl font-bold text-slate-950">
                  {t(`steps.${activeStep.id}.title`)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveStepId(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label={t('modal.close')}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <blockquote className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3">
                <p className="text-base font-medium leading-7 text-emerald-950">
                  {t(`steps.${activeStep.id}.quote`)}
                </p>
                <footer className="mt-2 text-sm font-semibold text-emerald-800">
                  {t(`steps.${activeStep.id}.quoteBy`)}
                </footer>
              </blockquote>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('modal.contextLabel')}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {t(`steps.${activeStep.id}.subject`)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t(`steps.${activeStep.id}.details`)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{t('modal.practiceLabel')}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {t(`steps.${activeStep.id}.practice`)}
                </p>
                <textarea
                  value={draftNotes[activeStep.id] ?? ''}
                  onChange={(event) => setDraftNote(activeStep.id, event.target.value)}
                  className="mt-4 min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  aria-label={t('modal.draftNotesLabel')}
                  placeholder={t('modal.draftNotesPlaceholder')}
                />
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <SparklesIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">{t('modal.winWinWinLabel')}</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      {t(`steps.${activeStep.id}.winWinWin`)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setActiveStepId(null)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                {t('modal.close')}
              </button>
              <Link
                href={activeStep.href}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t(`actions.${activeStep.actionKey}`)}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <button
                type="button"
                disabled={isPending && pendingStepId === activeStep.id}
                onClick={() => setDone(activeStep.id, !completedSet.has(activeStep.id))}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
              >
                <CheckIcon className="h-4 w-4" />
                {completedSet.has(activeStep.id) ? t('actions.reopen') : t('actions.markDone')}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
