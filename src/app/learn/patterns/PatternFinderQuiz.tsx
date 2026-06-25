'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChangePattern } from './types';
import { ChevronLeftIcon, SparklesIcon, CheckCircleIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z_CLASS } from '@/lib/z-index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patterns: ChangePattern[];
}

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; weight: Partial<Record<keyof ChangePattern, string[]>> }[];
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 'context',
    question: 'What is your primary context for change?',
    options: [
      {
        value: 'crisis',
        label: 'Crisis response - immediate action needed',
        weight: {
          bestContext: ['Crises', 'marginalized', 'desperate', 'last-stand'],
          levelOfChange: ['Community', 'Individual'],
        },
      },
      {
        value: 'institutional',
        label: 'Institutional reform - working within systems',
        weight: {
          bestContext: ['Municipal', 'institutional', 'policy', 'legal'],
          levelOfChange: ['Institutional', 'Policy'],
        },
      },
      {
        value: 'movement',
        label: 'Movement building - organizing people',
        weight: {
          bestContext: ['movement', 'organizing', 'shared identities'],
          levelOfChange: ['Community', 'Paradigm'],
        },
      },
      {
        value: 'structural',
        label: 'Structural change - addressing root causes',
        weight: {
          bestContext: ['structural', 'economic', 'paradigm'],
          levelOfChange: ['Structural', 'Paradigm'],
        },
      },
    ],
  },
  {
    id: 'risk',
    question: 'What level of personal risk can participants accept?',
    options: [
      {
        value: 'low',
        label: 'Minimal risk - safety is paramount',
        weight: {
          risks: ['Low', 'minimal', 'safe'],
          weaknesses: ['risk', 'danger', 'bravery'],
        },
      },
      {
        value: 'moderate',
        label: 'Some risk acceptable - balanced approach',
        weight: {
          risks: ['moderate', ' manageable'],
        },
      },
      {
        value: 'high',
        label: 'High risk acceptable - urgency justifies it',
        weight: {
          strengths: ['immediate', 'direct', 'disrupt'],
          risks: ['extreme', 'high', 'severe', 'arrest'],
        },
      },
    ],
  },
  {
    id: 'resources',
    question: 'What resources does your community have?',
    options: [
      {
        value: 'limited',
        label: 'Limited resources - need low-cost approaches',
        weight: {
          strengths: ['zero', 'low-cost', 'free', 'minimal'],
          mechanism: ['volunteer', 'horizontal', 'community'],
        },
      },
      {
        value: 'moderate',
        label: 'Some resources - can sustain campaigns',
        weight: {
          successFactors: ['capacity', 'funding', 'organizing'],
        },
      },
      {
        value: 'abundant',
        label: 'Strong resources - can invest long-term',
        weight: {
          successFactors: ['technical', 'expertise', 'funds', 'legal'],
        },
      },
    ],
  },
  {
    id: 'timeline',
    question: 'What timeline are you working with?',
    options: [
      {
        value: 'immediate',
        label: 'Immediate - days to weeks',
        weight: {
          strengths: ['immediate', 'rapid', 'instant', 'quick'],
          mechanism: ['disrupt', 'crisis', 'urgent'],
        },
      },
      {
        value: 'medium',
        label: 'Medium-term - months to a year',
        weight: {
          scaling: ['sequential', 'campaign', 'momentum'],
        },
      },
      {
        value: 'long',
        label: 'Long-term - years to decades',
        weight: {
          strengths: ['deep', 'resilient', 'sustainable', 'permanent'],
          mechanism: ['transform', 'build', 'create'],
        },
      },
    ],
  },
  {
    id: 'scale',
    question: 'What scale of change are you aiming for?',
    options: [
      {
        value: 'individual',
        label: 'Individual transformation',
        weight: {
          levelOfChange: ['Individual', 'Paradigm'],
        },
      },
      {
        value: 'community',
        label: 'Community-level change',
        weight: {
          levelOfChange: ['Community'],
        },
      },
      {
        value: 'policy',
        label: 'Policy or institutional change',
        weight: {
          levelOfChange: ['Policy', 'Institutional'],
        },
      },
      {
        value: 'systemic',
        label: 'Systemic/paradigm shift',
        weight: {
          levelOfChange: ['Structural', 'Paradigm'],
        },
      },
    ],
  },
];

function scoreWeightMatches(
  pattern: ChangePattern,
  weight: Partial<Record<keyof ChangePattern, string[]>>,
): number {
  let score = 0;
  Object.entries(weight).forEach(([field, matchValues]) => {
    const patternValue = pattern[field as keyof ChangePattern];
    if (typeof patternValue !== 'string') return;
    const lowerValue = patternValue.toLowerCase();
    matchValues.forEach(match => {
      if (lowerValue.includes(match.toLowerCase())) score += 1;
    });
  });
  return score;
}

function scorePattern(pattern: ChangePattern, answers: Record<string, string>): number {
  let score = 0;
  Object.entries(answers).forEach(([questionId, answerValue]) => {
    const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
    if (!question) return;
    const option = question.options.find(o => o.value === answerValue);
    if (!option) return;
    score += scoreWeightMatches(pattern, option.weight);
  });
  return score;
}

export default function PatternFinderQuiz({ isOpen, onClose, patterns }: Readonly<Props>) {
  const { t } = useTranslation('learning');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const recommendedPatterns = useMemo(() => {
    if (!showResults) return [];

    const scored = patterns.map(p => ({ pattern: p, score: scorePattern(p, answers) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5);
  }, [showResults, patterns, answers]);

  const handleAnswer = (value: string) => {
    const questionId = QUIZ_QUESTIONS[currentQuestion].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleClose = () => {
    resetQuiz();
    onClose();
  };

  const currentQ = QUIZ_QUESTIONS[currentQuestion];

  return (
    <>
      {isOpen && (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
          className={`fixed inset-0 ${Z_CLASS.profileModal} flex items-center justify-center p-4 bg-black/50`} onClick={handleClose}>
          <div // NOSONAR(S6848) — handler only stops propagation to the modal backdrop; no user action
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-emerald-500" />
                {t('patterns.quiz.title')}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {showResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-4"
                  >
                    <div className="text-center mb-6">
                      <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('patterns.quiz.resultsTitle')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {t('patterns.quiz.resultsSubtitle')}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {recommendedPatterns.map((item, index) => (
                        <Card
                          key={item.pattern.id}
                          className={`p-4 ${index === 0 ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {item.pattern.abbr}
                                </Badge>
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  {item.pattern.name}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.pattern.definition}
                              </p>
                              {index === 0 && (
                                <Badge className="mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                  {t('patterns.quiz.bestMatch')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.score} {t('patterns.quiz.points')}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={handleBack}>
                        {t('patterns.quiz.reviewAnswers')}
                      </Button>
                      <Button onClick={resetQuiz} className="flex items-center gap-2">
                        {t('patterns.quiz.startOver')}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="py-4"
                  >
                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{t('patterns.quiz.question')} {currentQuestion + 1} / {QUIZ_QUESTIONS.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                      {currentQ.question}
                    </h3>

                    <div className="space-y-3">
                      {currentQ.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(option.value)}
                          className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                            answers[currentQ.id] === option.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className="text-gray-900 dark:text-white">{option.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentQuestion === 0}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                        {t('patterns.quiz.back')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
