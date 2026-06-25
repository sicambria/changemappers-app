'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { saveAssessmentAction } from '@/app/actions/onboarding';

interface Props {
    userId: string;
    onSuccess: (cmapLevel: number) => void;
    onBack: () => void;
}

export default function Stage25Assessment({ userId, onSuccess, onBack }: Readonly<Props>) {
  const { t } = useTranslation(['auth', 'common']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Record<string, number | string | null>>({
    q1_role: null,
    q2_focus: null,
    q3_activity: 1,
    q4_project: null,
    q5_systemic: 1,
  });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAssessmentUpdate = (key: string, value: any) => {
        setAssessment(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await saveAssessmentAction({
                q2_focus: assessment.q2_focus ? String(assessment.q2_focus) : undefined,
                q3_activity: assessment.q3_activity ? Number(assessment.q3_activity) : undefined,
                q4_project: assessment.q4_project ? String(assessment.q4_project) : undefined,
                q5_systemic: assessment.q5_systemic ? Number(assessment.q5_systemic) : undefined,
            }, userId);

      if (res.success && res.cmapLevel !== undefined) {
      onSuccess(res.cmapLevel);
      } else {
      setError(res.error || t('onboarding.errors.saveFailed'));
      }
      } catch {
      setError(t('onboarding.errors.generic'));
      } finally {
            setIsSubmitting(false);
        }
    };

  return (
  <div className="space-y-6">
  <div className="text-center mb-4">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage2_5.title')}</h2>
  <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage2_5.subtitle')}</p>
  </div>

  <div className="space-y-5">
  <div>
  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage2_5.q1_focus')}</label>
  <select
  data-testid="onboarding-stage25-focus"
  value={assessment.q2_focus as string || ''}
  onChange={e => handleAssessmentUpdate('q2_focus', e.target.value)}
  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
  >
  <option value="" disabled>{t('onboarding.stage2_5.q1_placeholder')}</option>
  <option value="local">{t('onboarding.stage2_5.q1_local')}</option>
  <option value="regional">{t('onboarding.stage2_5.q1_regional')}</option>
  <option value="global">{t('onboarding.stage2_5.q1_global')}</option>
  </select>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage2_5.q2_activity')}</label>
  <div className="flex items-center gap-4">
  <span className="text-xs text-gray-400">{t('onboarding.stage2_5.q2_observer')}</span>
  <input type="range" min="1" max="5"
  data-testid="onboarding-stage25-activity"
  value={assessment.q3_activity as number}
  onChange={e => handleAssessmentUpdate('q3_activity', Number.parseInt(e.target.value))}
  className="flex-1 accent-emerald-500" />
  <span className="text-xs text-gray-400">{t('onboarding.stage2_5.q2_catalyst')}</span>
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage2_5.q3_project')}</label>
  <div className="flex flex-col gap-2">
  {['yes', 'formal', 'no'].map(opt => (
  <label key={opt} className="flex items-center gap-2">
  <input type="radio" data-testid={`onboarding-stage25-project-${opt}`} checked={assessment.q4_project === opt}
  onChange={() => handleAssessmentUpdate('q4_project', opt)}
  className="text-emerald-600 focus:ring-emerald-500" />
  <span className="text-sm">{(() => {
    if (opt === 'yes') return t('onboarding.stage2_5.q3_yes');
    if (opt === 'formal') return t('onboarding.stage2_5.q3_formally');
    return t('onboarding.stage2_5.q3_no');
  })()}</span>
  </label>
  ))}
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage2_5.q4_systemic')}</label>
  <div className="flex items-center gap-4">
  <span className="text-xs text-gray-400">{t('onboarding.stage2_5.q4_not_at_all')}</span>
  <input type="range" min="1" max="5"
  data-testid="onboarding-stage25-systemic"
  value={assessment.q5_systemic as number}
  onChange={e => handleAssessmentUpdate('q5_systemic', Number.parseInt(e.target.value))}
  className="flex-1 accent-emerald-500" />
  <span className="text-xs text-gray-400">{t('onboarding.stage2_5.q4_actively')}</span>
  </div>
  </div>
  </div>

  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

  <div className="flex gap-3 pt-4">
  <Button variant="outline" onClick={onBack} className="flex-1">
  <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage2_5.backButton')}
  </Button>
  <Button onClick={handleNext} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage25-submit">
  {t('onboarding.stage2_5.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
  </Button>
  </div>
  </div>
  );
}
