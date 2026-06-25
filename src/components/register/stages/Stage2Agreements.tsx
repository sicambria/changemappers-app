'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { saveAgreementsAction } from '@/app/actions/onboarding';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

const AGREEMENTS = [
    { key: 'pledge_contributor' },
    { key: 'pledge_difference' },
    { key: 'pledge_friction' },
    { key: 'pledge_share' },
    { key: 'pledge_notice' },
    { key: 'pledge_accountability' },
    { key: 'charter_accepted' },
];

interface Props {
    userId: string;
    onSuccess: () => void;
    onBack: () => void;
}

export default function Stage2Agreements({ userId, onSuccess, onBack }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const [agreements, setAgreements] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStage2 = async () => {
        const allAgreed = AGREEMENTS.every(a => agreements[a.key]);
        if (!allAgreed) {
            setError(t('onboarding.errors.stage2_agreements'));
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const fd = new FormData();
            AGREEMENTS.forEach(a => fd.append(a.key, 'on'));
            const res = await saveAgreementsAction(fd, userId);
            if (res.success) {
                onSuccess();
            } else {
                setError(res.error ?? t('onboarding.errors.saveAgreementsFailed'));
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage2.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage2.subtitle')}</p>
            </div>

            <div className="space-y-3">
                {AGREEMENTS.map((a, index) => (
                    <label // NOSONAR(S6853) — implicit label/control association; the accessible name is computed from descendant text per the accname spec, which Sonar's depth-2 traversal misses
                      key={a.key}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${agreements[a.key] ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'
                            }`}>
                        <input
                            data-testid={`onboarding-stage2-${a.key}`}
                            type="checkbox"
                            checked={!!agreements[a.key]}
                            onChange={(e) => setAgreements(prev => ({ ...prev, [a.key]: e.target.checked }))}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 flex-shrink-0"
                        />
                        <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{t(`onboarding.static.agreements.${index}.title`)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t(`onboarding.static.agreements.${index}.text`)}</div>
                        </div>
                    </label>
                ))}
            </div>

            <p className="text-xs text-gray-400 italic text-center px-4">
                {t('onboarding.stage2.timestampNotice')}
            </p>

            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg">{error}</div>}

            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage2.backButton')}
                </Button>
                <Button onClick={handleStage2} isLoading={isSubmitting} className="flex-1"
                    data-testid="onboarding-stage2-submit"
                    disabled={!AGREEMENTS.every(a => agreements[a.key])}>
                    {t('onboarding.stage2.acceptButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
