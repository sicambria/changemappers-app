'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { XIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon, TrophyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { QuestionnaireConfig } from '@/config/questionnaires';

interface GenericQuestionnaireProps {
    config: QuestionnaireConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (result: any) => Promise<{ success: boolean; error?: string }>;
    onClose: () => void;
    onComplete: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialAnswers?: any; // To prepopulate if needed
}

function resolveSelectedIndexes(ans: unknown): number[] {
    if (Array.isArray(ans)) return ans as number[];
    if (ans !== null && ans !== undefined) return [ans as number];
    return [];
}

function sumPointsResult(
    answers: unknown[],
    questions: QuestionnaireConfig['questions'],
): string {
    let totalPoints = 0;
    answers.forEach((ansIndex, qIndex) => {
        if (ansIndex !== null && typeof ansIndex === 'number') {
            totalPoints += questions[qIndex].options[ansIndex].points || 0;
        }
    });
    if (totalPoints >= 28) return 'LEVEL_9';
    if (totalPoints >= 25) return 'LEVEL_8';
    if (totalPoints >= 22) return 'LEVEL_7';
    if (totalPoints >= 19) return 'LEVEL_6';
    if (totalPoints >= 15) return 'LEVEL_5';
    if (totalPoints >= 12) return 'LEVEL_4';
    if (totalPoints >= 9) return 'LEVEL_3';
    if (totalPoints >= 6) return 'LEVEL_2';
    if (totalPoints >= 3) return 'LEVEL_1';
    return 'LEVEL_0';
}

function countTagsResult(
    answers: unknown[],
    questions: QuestionnaireConfig['questions'],
    maxTotalSelections: number | undefined,
): string[] {
    const tagCounts: Record<string, number> = {};
    answers.forEach((ans, qIndex) => {
        const options = questions[qIndex].options;
        resolveSelectedIndexes(ans).forEach(idx => {
            const tags = options[idx]?.tags || [];
            tags.forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
    });
    return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0])
        .slice(0, maxTotalSelections || 3);
}

function directSelectionResult(
    answers: unknown[],
    questions: QuestionnaireConfig['questions'],
): string[] {
    const selectedValues: string[] = [];
    answers.forEach((ans, qIndex) => {
        const options = questions[qIndex].options;
        resolveSelectedIndexes(ans).forEach(idx => {
            if (options[idx]?.value) {
                selectedValues.push(options[idx].value);
            }
        });
    });
    return selectedValues;
}

export function GenericQuestionnaire({ config, onSave, onClose, onComplete, initialAnswers: _initialAnswers }: Readonly<GenericQuestionnaireProps>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [step, setStep] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [answers, setAnswers] = useState<any[]>(Array(config.questions.length).fill(null));
    const [isSubmitting, setIsSubmitting] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [resultData, setResultData] = useState<any>(null);

    const currentQ = config.questions[step];
    const isMultiSelect = (currentQ.maxSelectable || 1) > 1;

    // Handle selection for the current question
    const handleSelect = (idx: number) => {
        const currentAnswers = answers[step] || (isMultiSelect ? [] : null);

        let newAnswerForStep;
        if (isMultiSelect) {
            if (currentAnswers.includes(idx)) {
                newAnswerForStep = currentAnswers.filter((i: number) => i !== idx);
            } else if (currentAnswers.length < (currentQ.maxSelectable || 999)) {
                newAnswerForStep = [...currentAnswers, idx];
            } else {
                toast.error(t('questionnaire.errors.maxSelectable', { count: currentQ.maxSelectable }));
                return;
            }
        } else {
            newAnswerForStep = idx;
        }

        const newAnswers = [...answers];
        newAnswers[step] = newAnswerForStep;

        // Enforce global maxTotalSelections if applicable (basic implementation assuming one or few questions)
        if (config.maxTotalSelections) {
            let totalSelected = 0;
            newAnswers.forEach(ans => {
                if (Array.isArray(ans)) totalSelected += ans.length;
                else if (ans !== null) totalSelected += 1;
            });
            if (totalSelected > config.maxTotalSelections) {
                toast.error(t('questionnaire.errors.maxTotal', { count: config.maxTotalSelections }));
                return;
            }
        }

        setAnswers(newAnswers);
    };

    const isCurrentStepValid = () => {
        const currentAns = answers[step];
        if (isMultiSelect) {
            return (currentAns?.length ?? 0) > 0;
        }
        return currentAns !== null;
    };

    const handleNext = () => {
        if (!isCurrentStepValid() && !config.maxTotalSelections) {
            // In tests like RDG or Archetypes, skipping might be allowed if maxTotalSelections enforces overall count,
            // but generally we require at least 1 per question unless it's a global select.
            if (answers[step] === null || (Array.isArray(answers[step]) && answers[step].length === 0)) {
                toast.error(t('questionnaire.errors.answerRequired'));
                return;
            }
        }
        if (step < config.questions.length - 1) {
            setStep(step + 1);
        } else {
            calculateAndSubmit();
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    const calculateAndSubmit = async () => {
        setIsSubmitting(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let finalResult: any = null;

        if (config.scoringStrategy === 'SUM_POINTS') {
            finalResult = sumPointsResult(answers, config.questions);
        } else if (config.scoringStrategy === 'COUNT_TAGS') {
            finalResult = countTagsResult(answers, config.questions, config.maxTotalSelections);
        } else if (config.scoringStrategy === 'DIRECT_SELECTION') {
            finalResult = directSelectionResult(answers, config.questions);
        }

        try {
            const res = await onSave(finalResult);
            if (res.success) {
                setResultData(finalResult);
            } else {
                toast.error(res.error || t('questionnaire.errors.saveFailed'));
            }
        } catch {
            toast.error(t('questionnaire.errors.requestFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (resultData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <Card className="w-full max-w-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/50 dark:to-teal-900/50 shadow-2xl border-emerald-200 dark:border-emerald-800">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <TrophyIcon className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{t('questionnaire.result.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            {t('questionnaire.result.description')}
                        </p>

                        {config.scoringStrategy === 'SUM_POINTS' && typeof resultData === 'string' && resultData.startsWith('LEVEL_') && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">{t('questionnaire.result.levelPrefix')} {resultData.replace('LEVEL_', '')}</div>
                                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {t(`individual.changemakeLevel.${resultData.toLowerCase()}.name`, resultData)}
                                </h3>
                            </div>
                        )}
                        {(config.scoringStrategy === 'COUNT_TAGS' || config.scoringStrategy === 'DIRECT_SELECTION') && Array.isArray(resultData) && (
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {resultData.map(res => (
                                    <span key={res} className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                        {String(t(`individual.archetypes.${res.toLowerCase().replaceAll('_', '')}`, res))}
                                    </span>
                                ))}
                            </div>
                        )}

                        <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onComplete(); onClose(); }}>
                            {t('questionnaire.actions.toProfile')}
                        </Button>
                    </CardContent>
                </Card>
            </div >
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between bg-white dark:bg-gray-950 z-10 border-b pb-4 rounded-t-xl shrink-0">
                    <div className="space-y-1">
                        <CardTitle>{String(t(config.titleKey, { defaultValue: config.titleKey }))}</CardTitle>
                        {config.questions.length > 1 && (
                            <div className="text-sm text-gray-500">
                                {t('questionnaire.step', { current: step + 1, total: config.questions.length })}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent className="pt-6 flex-1 overflow-y-auto">
                    {/* Progress Bar */}
                    {config.questions.length > 1 && (
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 mb-8 overflow-hidden">
                            <div
                                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${((step) / config.questions.length) * 100}%` }}
                            ></div>
                        </div>
                    )}

                    {config.descriptionKey && step === 0 && (
                        <p className="text-gray-600 dark:text-gray-400 mb-6 italic">{t(config.descriptionKey, { defaultValue: config.descriptionKey })}</p>
                    )}

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
                        {t(currentQ.text)}
                    </h3>

                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((opt, idx) => {
                            const isSelected = isMultiSelect
                                ? (answers[step] || []).includes(idx)
                                : answers[step] === idx;

                            return (
                                <button
                                    key={opt.text}
                                    onClick={() => handleSelect(idx)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${isSelected
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm ring-1 ring-emerald-500/50'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {isSelected && <CheckCircleIcon className="w-3 h-3" />}
                                        </div>
                                        <span className={`text-sm md:text-base leading-snug ${isSelected ? 'text-emerald-900 dark:text-emerald-100 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {t(opt.text, { defaultValue: opt.text })}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl shrink-0">
                    <div className="flex justify-between items-center max-w-2xl mx-auto">
                        <Button
                            variant="ghost"
                            onClick={handlePrev}
                            disabled={step === 0 || isSubmitting}
                            className="hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-2" /> {t('common:actions.back')}
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px] shadow-sm"
                        >
                            {(() => {
                                if (step !== config.questions.length - 1) return <>{t('common:actions.next')} <ArrowRightIcon className="w-4 h-4 ml-2" /></>;
                                if (isSubmitting) return t('questionnaire.actions.processing');
                                return t('questionnaire.actions.finish');
                            })()}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
