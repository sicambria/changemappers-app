'use client';

import React, { useState, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import DOMPurify from 'isomorphic-dompurify';
import { CATEGORIES, LIFE_EXPECTANCY, CURRENT_YEAR } from './lifeWheel.config';
import { LifeWheelRadarChart } from './LifeWheelRadarChart';

import { useRouter } from 'next/navigation';

export default function LifeWheelClient() {
  const { t } = useTranslation('reflect');
  const router = useRouter();
  
  // State
  const [step, setStep] = useState(0);
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [nextStepAction, setNextStepAction] = useState('');
  const [reminderAction, setReminderAction] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalQuestions = CATEGORIES.length * 3;

  const calculateAge = () => birthYear ? CURRENT_YEAR - Number.parseInt(birthYear) : 0;
  const calculateRemainingYears = () => {
    const age = calculateAge();
    const expected = gender === 'male' ? LIFE_EXPECTANCY.male : LIFE_EXPECTANCY.female;
    return Math.max(0, Math.round(expected - age));
  };

  const currentAge = calculateAge();
  const remainingYears = calculateRemainingYears();

  const getResults = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scores: Record<string, any> = {};
    CATEGORIES.forEach(cat => {
      const past = answers[`${cat.id}_past`] || 5;
      const present = answers[`${cat.id}_present`] || 5;
      const future = answers[`${cat.id}_future`] || 5;
      scores[cat.id] = { past, present, future, trend: present - past };
    });

    const scoreValues = Object.values(scores);
    const avgPast = scoreValues.reduce((sum, s) => sum + s.past, 0) / scoreValues.length;
    const avgPresent = scoreValues.reduce((sum, s) => sum + s.present, 0) / scoreValues.length;
    const avgFuture = scoreValues.reduce((sum, s) => sum + s.future, 0) / scoreValues.length;

    return {
      scores,
      lifeSatisfaction: avgPresent,
      avgPast,
      avgPresent,
      avgFuture,
      pastToPresent: avgPresent - avgPast,
      presentToFuture: avgFuture - avgPresent
    };
  };

  const getStatus = (score: number, trend: number) => {
    if (trend > 0.5) {
      if (score >= 6.5) return { label: t('lifewheel.results.status.thrivingGrowing'), color: 'text-green-600 dark:text-green-400', icon: '🌟' };
      if (score >= 4.5) return { label: t('lifewheel.results.status.improving'), color: 'text-yellow-600 dark:text-yellow-400', icon: '📈' };
      return { label: t('lifewheel.results.status.rising'), color: 'text-cyan-600 dark:text-cyan-400', icon: '🚀' };
    }
    if (score >= 7.5) return { label: t('lifewheel.results.status.thriving'), color: 'text-green-600 dark:text-green-400', icon: '🌟' };
    if (score >= 5) return { label: t('lifewheel.results.status.stable'), color: 'text-yellow-600 dark:text-yellow-400', icon: '⚖️' };
    return { label: t('lifewheel.results.status.ready'), color: 'text-cyan-600 dark:text-cyan-400', icon: '🔄' };
  };

  const handleRestart = () => {
    setStep(0);
    setBirthYear('');
    setGender('');
    setAnswers({});
    setNextStepAction('');
    setReminderAction('');
  };

  if (!mounted) return null;

  // --- RENDERING HELPERS ---

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex justify-start no-print">
        <Button 
          variant="outline" 
          onClick={() => router.push('/reflect')}
          className="rounded-xl border-gray-200 dark:border-gray-800"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('lifewheel.intro.backToReflect', { defaultValue: 'Vissza a reflexiohoz' })}
        </Button>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
          {t('lifewheel.title')}
        </h1>
        <p className="text-xl text-muted-foreground">{t('lifewheel.subtitle')}</p>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-amber-200 dark:border-amber-900">
        <CardContent className="p-8 text-center space-y-4">
          <Info className="h-12 w-12 mx-auto text-amber-600" />
          <p className="text-lg leading-relaxed">{t('lifewheel.intro.cardTitle')}</p>
          <p className="text-md italic text-muted-foreground">{t('lifewheel.intro.cardQuote')}</p>
        </CardContent>
      </Card>

      <div className="max-w-2xl mx-auto text-center space-y-4 text-muted-foreground">
        <p>{t('lifewheel.intro.explanation')}</p>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900 rounded-lg text-sm font-medium text-yellow-800 dark:text-yellow-400">
          ⚠️ {t('lifewheel.intro.disclaimer')}
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="birthYear">{t('lifewheel.intro.birthYearLabel')}</Label>
          <input
            id="birthYear"
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder={t('lifewheel.intro.birthYearPlaceholder')}
            className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-600 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label>{t('lifewheel.intro.genderLabel')}</Label>
          <div className="flex gap-4">
            <Button
              variant={gender === 'male' ? 'primary' : 'outline'}
              className="flex-1 h-12 rounded-xl transition-all"
              onClick={() => setGender('male')}
            >
              {t('lifewheel.intro.genderMale')}
            </Button>
            <Button
              variant={gender === 'female' ? 'primary' : 'outline'}
              className="flex-1 h-12 rounded-xl transition-all"
              onClick={() => setGender('female')}
            >
              {t('lifewheel.intro.genderFemale')}
            </Button>
          </div>
        </div>

{birthYear && gender && (
<div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-500 text-center">
<p className="text-2xl font-bold">{t('lifewheel.intro.ageInfoLine1', { age: currentAge })}</p>
<div className="mt-2 text-lg opacity-95">
{/* SAFE: Content is sourced from translations and sanitized via isomorphic-dompurify */}
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('lifewheel.intro.ageInfoLine2', { remaining: remainingYears })) }} />
</div>
<p className="text-sm opacity-80 mt-1">{t('lifewheel.intro.ageInfoLine3')}</p>
</div>
)}

        <Button
          disabled={!birthYear || !gender}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
          onClick={() => setStep(1)}
        >
          {t('lifewheel.intro.startButton')}
        </Button>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const qIndex = Math.floor((step - 1) / 3);
    const subStep = (step - 1) % 3;
    const category = CATEGORIES[qIndex];
    if (!category) return null;

    const timeKey = ['past', 'present', 'future'][subStep] as 'past' | 'present' | 'future';
    const yearValues = {
      past: CURRENT_YEAR - 5,
      present: CURRENT_YEAR,
      future: CURRENT_YEAR + 5
    };

    const value = answers[`${category.id}_${timeKey}`] || 5;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-background shadow-lg mb-2" style={{ color: category.color }}>
            {category.icon}
          </div>
          <h2 className="text-3xl font-bold" style={{ color: category.color }}>
            {t(`lifewheel.categories.${category.id}`)}
          </h2>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{t(`lifewheel.questions.titles.${timeKey}`, { year: yearValues[timeKey] })}</div>
            <div className="text-lg text-muted-foreground">{t(`lifewheel.questions.subtitles.${timeKey}`)}</div>
          </div>
        </div>

        <Card className="border-2 shadow-xl" style={{ borderColor: `${category.color}30` }}>
          <CardContent className="p-8 space-y-10">
            <p className="text-xl font-medium leading-relaxed text-center">
              {t(`lifewheel.questions_data.${category.id}.${timeKey}`)}
            </p>
            
            <div className="space-y-6">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={value}
                onChange={(e) => setAnswers({ ...answers, [`${category.id}_${timeKey}`]: Number.parseInt(e.target.value) })}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                style={{ 
                  background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)` 
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-red-500">1 - {t('lifewheel.questions.scale.min')}</span>
                <span className="text-4xl font-extrabold" style={{ color: category.color }}>{value}</span>
                <span className="text-sm font-semibold text-green-500">10 - {t('lifewheel.questions.scale.max')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-shrink-0 h-12 px-8 rounded-xl"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            {t('lifewheel.questions.actions.back')}
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl text-lg font-bold text-white shadow-md hover:scale-[1.02] transition-transform"
            style={{ backgroundColor: category.color }}
            onClick={() => {
              if (step < totalQuestions) {
                setStep(step + 1);
              } else {
                setStep(100); // 100 as results code
              }
            }}
          >
            {step < totalQuestions ? t('lifewheel.questions.actions.next') : t('lifewheel.questions.actions.results')}
            {step < totalQuestions && <ChevronRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>

        <div className="text-center font-medium text-muted-foreground">
          {t('lifewheel.questions.progress', { current: step, total: totalQuestions })}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const results = getResults();
    const { scores, lifeSatisfaction, avgPast, avgPresent, avgFuture, pastToPresent } = results;
    const status = getStatus(lifeSatisfaction, pastToPresent);

return (
<div className="max-w-4xl mx-auto space-y-12 pb-20 print-m-0">
<div className="text-center space-y-4 no-print">
<h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
{t('lifewheel.results.title')}
</h2>
<div
className="text-2xl sm:text-3xl font-bold leading-tight"
// SAFE: Content is sourced from translations and sanitized via isomorphic-dompurify
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('lifewheel.results.subtitle', { remaining: remainingYears })) }}
/>
</div>

        {/* Hero Score Card */}
        <Card className="overflow-hidden border-2 shadow-2xl animate-in zoom-in-95 duration-700">
          <div className="bg-gradient-to-br from-background to-muted p-8 sm:p-12 text-center space-y-6">
            <div className="text-7xl mb-4">{status.icon}</div>
            <div className={`text-4xl font-black ${status.color}`}>{status.label}</div>
            <div className="relative inline-block">
                <span className="text-8xl font-black text-primary">{lifeSatisfaction.toFixed(1)}</span>
                <span className="text-2xl font-bold text-muted-foreground absolute -right-12 bottom-4">/10</span>
            </div>
            <p className="text-xl font-medium text-muted-foreground">{t('lifewheel.results.satisfactionIndex')}</p>

            <div className="grid grid-cols-3 gap-4 pt-8 max-w-lg mx-auto">
              <div className="space-y-1">
                <div className="text-sm font-bold uppercase text-muted-foreground">{t('lifewheel.results.time.past')}</div>
                <div className="text-2xl font-black">{avgPast.toFixed(1)}</div>
              </div>
              <div className="space-y-1 border-x border-muted-foreground/20">
                <div className="text-sm font-bold uppercase text-primary">{t('lifewheel.results.time.present')}</div>
                <div className="text-3xl font-black text-primary">{avgPresent.toFixed(1)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold uppercase text-muted-foreground">{t('lifewheel.results.time.future')}</div>
                <div className="text-2xl font-black">{avgFuture.toFixed(1)}</div>
              </div>
            </div>

            {pastToPresent > 0.3 && (
              <div className="inline-flex items-center px-6 py-2 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold border border-green-200 dark:border-green-800 animate-bounce mt-4">
                {t('lifewheel.results.improvement', { points: pastToPresent.toFixed(1) })}
              </div>
            )}
          </div>
        </Card>

        {/* Charts Grid */}
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">{t('lifewheel.results.lifewheelTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {(['past', 'present', 'future'] as const).map((time) => (
                    <Card key={time} className="p-4 flex flex-col items-center">
                        <div className="text-sm font-bold text-muted-foreground uppercase mb-4">{t(`lifewheel.results.time.${time}`)}</div>
                        <LifeWheelRadarChart scores={scores} time={time} />
                    </Card>
                ))}
            </div>
        </div>

        {/* Detailed List */}
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">{t('lifewheel.results.detailedAnalysisTitle')}</h3>
            <div className="grid grid-cols-1 gap-6">
                {CATEGORIES.map(cat => {
                    const score = scores[cat.id];
                    const catStatus = getStatus(score.present, score.trend);
                    return (
                        <Card key={cat.id} className="overflow-hidden border-l-8" style={{ borderLeftColor: cat.color }}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-muted" style={{ color: cat.color }}>{cat.icon}</div>
                                        <div>
                                            <h4 className="text-xl font-bold">{t(`lifewheel.categories.${cat.id}`)}</h4>
                                            <p className={`font-semibold ${catStatus.color}`}>{catStatus.label}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black" style={{ color: cat.color }}>{score.present}/10</div>
                                        <div className="flex items-center justify-end font-bold text-muted-foreground">
                                            {(() => {
                                                if (score.trend > 0) return '↑';
                                                if (score.trend < 0) return '↓';
                                                return '→';
                                            })()}
                                            <span className="ml-1">{Math.abs(score.trend).toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="p-3 bg-muted rounded-xl text-center">
                                        <div className="text-xs font-bold text-muted-foreground uppercase">{t('lifewheel.results.time.past')}</div>
                                        <div className="text-xl font-bold">{score.past}</div>
                                    </div>
                                    <div className="p-3 bg-muted border-2 border-primary/20 rounded-xl text-center">
                                        <div className="text-xs font-bold text-primary uppercase">{t('lifewheel.results.time.present')}</div>
                                        <div className="text-xl font-bold text-primary">{score.present}</div>
                                    </div>
                                    <div className="p-3 bg-muted rounded-xl text-center">
                                        <div className="text-xs font-bold text-muted-foreground uppercase">{t('lifewheel.results.time.future')}</div>
                                        <div className="text-xl font-bold">{score.future}</div>
                                    </div>
                                </div>

{score.future < score.present && score.future < 5 && (
<div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl flex gap-3 items-start">
<Info className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
{/* SAFE: Content is sourced from translations and sanitized via isomorphic-dompurify */}
<p className="text-sm text-red-800 dark:text-red-400" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('lifewheel.results.warning')) }} />
</div>
)}
{score.future > score.present && score.future >= 8 && (
<div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex gap-3 items-start">
<Sparkles className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
{/* SAFE: Content is sourced from translations and sanitized via isomorphic-dompurify */}
<p className="text-sm text-green-800 dark:text-green-400" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('lifewheel.results.greatDirection')) }} />
</div>
)}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>

        {/* Deathbed Message Section */}
        <Card className="bg-slate-900 text-white shadow-2xl border-none overflow-hidden">
            <CardContent className="p-8 sm:p-12 space-y-8">
                <div className="text-6xl text-center">✨</div>
                <h3 className="text-3xl font-black text-center">{t('lifewheel.results.deathbed.title')}</h3>
                
                <div className="max-w-2xl mx-auto space-y-6 text-xl leading-relaxed opacity-90">
                    {(() => {
                        if (pastToPresent > 0.5) return (
                            <>
                                <p>{t('lifewheel.results.deathbed.positiveGrowth', { points: pastToPresent.toFixed(1) })}</p>
                                <p className="font-bold text-emerald-400">
                                    {results.presentToFuture > 0 ? t('lifewheel.results.deathbed.positiveFuture') : t('lifewheel.results.deathbed.positiveStagnation')}
                                </p>
                            </>
                        );
                        if (pastToPresent > -0.5) return (
                            <>
                                <p>{t('lifewheel.results.deathbed.stableGrowth', {
                                    futureOutlook: results.presentToFuture > 0 ? t('lifewheel.results.deathbed.stableFuturePositive') : t('lifewheel.results.deathbed.stableFutureNeutral')
                                })}</p>
                                <p className="font-bold text-amber-400">{t('lifewheel.results.deathbed.stableNextStep')}</p>
                            </>
                        );
                        return (
                            <>
                                <p>{t('lifewheel.results.deathbed.decline')}</p>
                                <p className="font-bold text-rose-400">{t('lifewheel.results.deathbed.declineNextStep')}</p>
                            </>
                        );
                    })()}
                </div>

                <div className="bg-white/10 p-8 rounded-3xl border border-white/10 mt-12">
                    <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>📝</span> {t('lifewheel.results.recipe.title')}
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
                        {(t('lifewheel.results.recipe.items', { returnObjects: true }) as string[]).map((item, i) => (
                            <li key={item} className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <span className="opacity-70">{i+1}.</span>
                                <span className="text-sm sm:text-base font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>

        {/* Planning Section */}
        <Card className="p-8 sm:p-12 border-2 shadow-xl space-y-8">
            <h3 className="text-3xl font-black text-center text-primary">{t('lifewheel.results.planning.title')}</h3>
            
            <div className="space-y-6 max-w-2xl mx-auto text-lg no-print">
                <div className="space-y-4">
                    <Label className="text-lg font-bold" htmlFor="nextStep">{t('lifewheel.results.planning.stepLabel')}</Label>
                    <textarea
                        id="nextStep"
                        value={nextStepAction}
                        onChange={(e) => setNextStepAction(e.target.value)}
                        placeholder={t('lifewheel.results.planning.stepPlaceholder')}
                        className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-all font-medium text-lg leading-relaxed dark:bg-slate-900"
                    />
                </div>
                
                <div className="space-y-4">
                    <Label className="text-lg font-bold" htmlFor="reminder">{t('lifewheel.results.planning.reminderLabel')}</Label>
                    <textarea
                        id="reminder"
                        value={reminderAction}
                        onChange={(e) => setReminderAction(e.target.value)}
                        placeholder={t('lifewheel.results.planning.reminderPlaceholder')}
                        className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-all font-medium text-lg leading-relaxed dark:bg-slate-900"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 no-print">
                <Button size="lg" className="h-14 px-10 rounded-2xl font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => globalThis.print()}>
                    <Printer className="mr-2 h-6 w-6" />
                    {t('lifewheel.results.actions.print')}
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl font-bold text-lg" onClick={handleRestart}>
                    <RotateCcw className="mr-2 h-6 w-6" />
                    {t('lifewheel.results.actions.restart')}
                </Button>
            </div>

            <div className="flex justify-center pt-8 no-print pb-4">
                <button 
                    onClick={() => router.push('/reflect')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary transition-colors mx-auto"
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t('lifewheel.intro.backToReflect')}
                </button>
            </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 pt-20">
      <div className="max-w-6xl mx-auto">
        {step === 0 && renderIntro()}
        {step > 0 && step <= totalQuestions && renderQuestion()}
        {step >= 100 && renderResults()}
      </div>
    </div>
  );
}
