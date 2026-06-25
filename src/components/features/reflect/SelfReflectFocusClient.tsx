'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type FocusQuestion = readonly [string, readonly [string, string, string]];
type FocusResult = {
  max: number;
  title: string;
  desc: string;
  tips: string[];
};

export function SelfReflectFocusClient() {
  const { t } = useTranslation('reflect');
  const questions = t('focus.questions', { returnObjects: true }) as FocusQuestion[];
  const results = t('focus.results', { returnObjects: true }) as FocusResult[];
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const totalQuestions = questions.length;
  const done = started && index >= totalQuestions;
  const result = useMemo(
    () => results.find((item) => score <= item.max) ?? results.at(-1)!,
    [results, score],
  );

  function choose(value: number) {
    setScore((prev) => prev + value);
    setIndex((prev) => prev + 1);
  }

  function restart() {
    setStarted(false);
    setIndex(0);
    setScore(0);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {!started && (
          <section className="text-center">
            <h1 className="text-3xl font-bold">{t('focus.title')}</h1>
            <p className="mt-4 text-slate-600">{t('focus.intro')}</p>
            <button type="button" onClick={() => setStarted(true)} className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white">
              {t('focus.start')}
            </button>
          </section>
        )}
        {started && !done && questions[index] && (
          <section>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{t('focus.questionCounter', { current: index + 1, total: totalQuestions })}</p>
            <h1 className="mt-3 text-2xl font-bold">{questions[index][0]}</h1>
            <div className="mt-6 space-y-3">
              {questions[index][1].map((option, optionIndex) => (
                <button key={option} type="button" onClick={() => choose(optionIndex + 1)} className="w-full rounded-lg border border-slate-200 p-4 text-left text-sm hover:border-emerald-500 hover:bg-emerald-50">
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}
        {done && result && (
          <section>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('focus.resultEyebrow')}</p>
            <h1 className="mt-2 text-3xl font-bold text-emerald-700">{result.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{t('focus.score', { score, total: totalQuestions * 3 })}</p>
            <p className="mt-5 text-slate-700">{result.desc}</p>
            <h2 className="mt-6 font-semibold">{t('focus.insights')}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">{result.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
            <button type="button" onClick={restart} className="mt-6 text-sm font-semibold text-emerald-700 underline">{t('focus.restart')}</button>
          </section>
        )}
      </div>
    </main>
  );
}
