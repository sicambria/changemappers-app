'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { XIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon, TrophyIcon } from 'lucide-react';
import { updateChangemakerLevelAction } from '@/app/actions/profile';
import { toast } from 'sonner';

interface ChangemakerQuestionnaireProps {
    userId: string;
    onClose: () => void;
    onComplete: () => void;
}

const questions: Array<{ id: string; options: Array<{ points: number }> }> = [
    {
        id: 'q1',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q2',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q3',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q4',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q5',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q6',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q7',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q8',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q9',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    },
    {
        id: 'q10',
        options: [
            { points: 0 },
            { points: 1 },
            { points: 2 },
            { points: 3 },
        ]
    }
];

// Calculation logic:
// Max points = 30
// LEVEL_0: 0-2 (Inert)
// LEVEL_1: 3-5 (Sympathizer)
// LEVEL_2: 6-8 (Consumer)
// LEVEL_3: 9-11 (Advocate)
// LEVEL_4: 12-14 (Organizer)
// LEVEL_5: 15-18 (Innovator)
// LEVEL_6: 19-21 (Scaler)
// LEVEL_7: 22-24 (Systems thinker)
// LEVEL_8: 25-27 (Paradigm shifter)
// LEVEL_9: 28-30 (Transnational)

export function ChangemakerQuestionnaire({ userId, onClose, onComplete }: Readonly<ChangemakerQuestionnaireProps>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultLevel, setResultLevel] = useState<string | null>(null);

    const handleSelect = (index: number) => {
        const newAnswers = [...answers];
        newAnswers[step] = index;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (answers[step] === -1) {
            toast.error(t('questionnaire.errors.answerRequired'));
            return;
        }
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            calculateResult();
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    const calculateResult = async () => {
        setIsSubmitting(true);
        let totalPoints = 0;
        answers.forEach((ansIndex, qIndex) => {
            totalPoints += questions[qIndex].options[ansIndex].points;
        });

        let level = 'LEVEL_0';
        if (totalPoints >= 28) level = 'LEVEL_9';
        else if (totalPoints >= 25) level = 'LEVEL_8';
        else if (totalPoints >= 22) level = 'LEVEL_7';
        else if (totalPoints >= 19) level = 'LEVEL_6';
        else if (totalPoints >= 15) level = 'LEVEL_5';
        else if (totalPoints >= 12) level = 'LEVEL_4';
        else if (totalPoints >= 9) level = 'LEVEL_3';
        else if (totalPoints >= 6) level = 'LEVEL_2';
        else if (totalPoints >= 3) level = 'LEVEL_1';

        try {
            const res = await updateChangemakerLevelAction(userId, level);
            if (res.success) {
                setResultLevel(level);
            } else {
                toast.error(res.error || t('questionnaire.errors.saveFailed'));
            }
        } catch {
            toast.error(t('questionnaire.errors.requestFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (resultLevel) {
        const levelNum = resultLevel.replace('LEVEL_', '');
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">{t('questionnaire.result.level', { level: levelNum })}</div>
                            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {t(`individual.changemakeLevel.level${levelNum}.name`)}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
                                &quot;{t(`individual.changemakeLevel.level${levelNum}.mindset`)}&quot;
                            </p>
                        </div>
                        <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onComplete(); onClose(); }}>
                            {t('questionnaire.actions.toProfile')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQ = questions[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-950 z-10 border-b pb-4">
                    <div className="space-y-1">
                        <CardTitle>{t('questionnaire.title')}</CardTitle>
                        <div className="text-sm text-gray-500">
                            {t('questionnaire.progress', { current: step + 1, total: questions.length })}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 mb-8">
                        <div
                            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${((step) / questions.length) * 100}%` }}
                        ></div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                        {t(`questionnaire.questions.${currentQ.id}.text`)}
                    </h3>

                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((opt, idx) => (
                            <button
                                key={idx /* NOSONAR(S6479) — static, hard-coded option list per question; never reordered/inserted/removed, so the index is a stable identity */}
                                onClick={() => handleSelect(idx)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${answers[step] === idx
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${answers[step] === idx ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300'
                                        }`}>
                                        {answers[step] === idx && <CheckCircleIcon className="w-3 h-3" />}
                                    </div>
                                    <span className={`text-sm md:text-base ${answers[step] === idx ? 'text-emerald-900 dark:text-emerald-100 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {t(`questionnaire.questions.${currentQ.id}.options.${idx}`)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            variant="ghost"
                            onClick={handlePrev}
                            disabled={step === 0 || isSubmitting}
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-2" /> {t('common:actions.back')}
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {(() => {
                                if (step !== questions.length - 1) return <>{t('common:actions.next')} <ArrowRightIcon className="w-4 h-4 ml-2" /></>;
                                if (isSubmitting) return t('questionnaire.actions.processing');
                                return t('questionnaire.actions.finish');
                            })()}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
