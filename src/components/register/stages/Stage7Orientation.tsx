'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { completeOrientationAction } from '@/app/actions/onboarding';
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed';
import { ArrowRightIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    userId: string;
}

export default function Stage7Orientation({ userId }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const router = useRouter();
    const [orientationCard, setOrientationCard] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOrientationComplete = async () => {
        setIsSubmitting(true);
        try {
            const res = await completeOrientationAction(userId);
            if (res.success) {
                router.push('/dashboard');
            } else {
                toast.error(res.error || t('onboarding.errors.saveFailed'));
            }
        } catch {
            toast.error(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cards: any = t('onboarding.stage7.cards', { returnObjects: true });

    const ORIENTATION_CARDS = [
        { emoji: '🗺️', title: cards?.card0?.title, text: cards?.card0?.text },
        { emoji: '🌱', title: cards?.card1?.title, text: cards?.card1?.text },
        { emoji: '🤝', title: cards?.card2?.title, text: cards?.card2?.text }
    ];

    return (
        <div className="space-y-6 text-center">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {orientationCard + 1} / {ORIENTATION_CARDS.length}
            </div>

            <div className="py-6 px-2">
                <div className="text-4xl mb-4">{ORIENTATION_CARDS[orientationCard].emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {ORIENTATION_CARDS[orientationCard].title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {ORIENTATION_CARDS[orientationCard].text}
                </p>
            </div>

            {orientationCard < ORIENTATION_CARDS.length - 1 ? (
                <Button onClick={() => setOrientationCard(c => c + 1)} data-testid="onboarding-stage7-next" className="w-full">
                    {t('onboarding.stage7.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            ) : (
                <div className="space-y-6">
                    <YouTubeEmbed videoId="jNQXAC9IVRw" title={t('onboarding.stage7.finishButton')} />
                    <Button onClick={handleOrientationComplete} data-testid="onboarding-stage7-finish" isLoading={isSubmitting} size="lg" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        {t('onboarding.stage7.finishButton')}
                    </Button>
                </div>
            )}

            {orientationCard > 0 && (
                <button type="button" onClick={() => setOrientationCard(c => c - 1)} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
                    ← {t('onboarding.stage7.backText')}
                </button>
            )}
        </div>
    );
}
