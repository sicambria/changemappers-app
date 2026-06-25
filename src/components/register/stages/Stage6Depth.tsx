'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/ui';
import { saveFunctionalDepthAction } from '@/app/actions/onboarding';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { FUNCTION_CATEGORIES } from './Stage5Functional';

const MOMENT_NEEDS = [
    'deepAnalysis', 'action', 'connection', 'retreat',
    'learning', 'sharing', 'experimentation', 'stability',
    'riskTaking', 'care', 'order', 'creativity',
];

const ALL_FUNCTIONS = FUNCTION_CATEGORIES.flatMap(c => c.functions);

interface Props {
    userId: string;
    cmapLevel: number;
    onSuccess: () => void;
    onBack: () => void;
}

function toggleItem(prev: string[], item: string): string[] {
    return prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item];
}

export default function Stage6Depth({ userId, cmapLevel, onSuccess, onBack }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const [subStep, setSubStep] = useState<1 | 2>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Part 1
    const [momentNeeds, setMomentNeeds] = useState<string[]>([]);
    const [currentProject, setCurrentProject] = useState('');
    const [avoidedFunctions, setAvoidedFunctions] = useState<string[]>([]);

    // Part 2
    const [currentActivities, setCurrentActivities] = useState<string[]>([]);
    const [desiredActivities, setDesiredActivities] = useState<string[]>([]);
    const [developedSkills, setDevelopedSkills] = useState<string[]>([]);

    const handlePart1Next = () => {
        if (cmapLevel >= 4) {
            setSubStep(2);
        } else {
            // L<4 skips phase 2, proceed to final submit instantly
            handleFinalSubmit();
        }
    };

    const handlePart1Skip = () => {
        if (cmapLevel >= 4) {
            setSubStep(2);
        } else {
            onSuccess();
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await saveFunctionalDepthAction({
                momentNeeds: momentNeeds.length > 0 ? momentNeeds : undefined,
                currentProjectDescription: currentProject || undefined,
                avoidedFunctions: avoidedFunctions.length > 0 ? avoidedFunctions : undefined,
                currentActivities: currentActivities.length > 0 ? currentActivities : undefined,
                desiredActivities: desiredActivities.length > 0 ? desiredActivities : undefined,
                developedSkills: developedSkills.length > 0 ? developedSkills : undefined,
            }, userId);

            if (res.success) {
                onSuccess();
            } else {
                setError(res.error ?? t('onboarding.errors.saveFailed'));
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const momentNeedsList: any = t('onboarding.stage6.momentNeedsList', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activitiesList: any = t('onboarding.stage6_5.activitiesList', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionsList: any = t('onboarding.stage5.functions', { returnObjects: true });

    if (subStep === 1) {
        return (
            <div className="space-y-5">
                <div className="text-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage6.title')}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage6.subtitle')}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('onboarding.stage6.avoidTitle')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
        {ALL_FUNCTIONS.map(fn => (
        <button key={fn} type="button" onClick={() => setAvoidedFunctions(prev => toggleItem(prev, fn))}
        className={`px-2 py-1 rounded-full text-xs border transition-colors ${avoidedFunctions.includes(fn)
        ? 'bg-orange-100 border-orange-400 text-orange-800'
        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}>
        {functionsList[fn] ?? fn}
        </button>
        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('onboarding.stage6.projectTitle')}
                    </label>
                    <textarea value={currentProject} onChange={(e) => setCurrentProject(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        rows={2} placeholder={t('onboarding.stage6.projectPlaceholder')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('onboarding.stage6.momentTitle')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {MOMENT_NEEDS.map(n => (
                            <button key={n} type="button" onClick={() => setMomentNeeds(prev => toggleItem(prev, n))}
                                className={`px-3 py-1 rounded-full text-xs border transition-colors ${momentNeeds.includes(n)
                                    ? 'bg-purple-100 border-purple-500 text-purple-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                    }`}>
                                {momentNeedsList[n] || n}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage6.backButton')}
                    </Button>
                    <Button onClick={handlePart1Next} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage6-part1-submit">
                        {t('onboarding.stage6.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                </div>

                <button type="button" onClick={handlePart1Skip} className="w-full text-center text-xs text-gray-400 hover:text-emerald-500">
                    {t('onboarding.stage6.skipButton')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage6_5.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage6_5.subtitle')}</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage6_5.q1_activities')}</label>
                    <div className="flex flex-wrap gap-2">
                        {['Strategy', 'Capacity building', 'Resource mobilization', 'Field work', 'Research', 'Organizing', 'Policy', 'Facilitation'].map(act => (
                            <button key={act} type="button"
                                onClick={() => setCurrentActivities(prev => toggleItem(prev, act))}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${currentActivities.includes(act) ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {activitiesList[act] || act}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage6_5.q2_desired')}</label>
                    <div className="flex flex-wrap gap-2">
                        {['Strategy', 'Capacity building', 'Resource mobilization', 'Field work', 'Research', 'Organizing', 'Policy', 'Mentoring'].map(act => (
                            <button key={act + '_desired'} type="button"
                                onClick={() => setDesiredActivities(prev => toggleItem(prev, act))}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${desiredActivities.includes(act) ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {activitiesList[act] || act}
                            </button>
                        ))}
                    </div>
                </div>

                {cmapLevel >= 5 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage6_5.q3_skills')}</label>
                        <Input value={developedSkills.join(', ')} onChange={(e) => setDevelopedSkills(e.target.value.split(',').map(s => s.trim()))}
                            placeholder={t('onboarding.stage6_5.q3_placeholder')} />
                    </div>
                )}
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setSubStep(1)} className="flex-1">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage6_5.backButton')}
                </Button>
                <Button onClick={handleFinalSubmit} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage6-part2-submit">
                    {t('onboarding.stage6_5.finishButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
