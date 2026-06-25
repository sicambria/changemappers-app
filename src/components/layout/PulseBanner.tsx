'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkPulseStatusAction } from '@/app/actions/pulse';
import { XIcon } from 'lucide-react';
import Link from 'next/link';

export function PulseBanner() {
    const { t } = useTranslation('common');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const checkPulse = async () => {
            try {
                const res = await checkPulseStatusAction();
                if (res?.needsPulse) setVisible(true);
            } catch {
                setVisible(false);
            }
        };
        // Adding a slight delay so it doesn't slow down the initial render
        const timer = setTimeout(checkPulse, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center text-sm shadow-md animate-in slide-in-from-top w-full sticky top-0 z-50">
            <div className="flex-1 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-center">
                <span className="font-bold px-2 py-0.5 bg-emerald-800 rounded text-xs uppercase tracking-wider hidden sm:inline-block">
                    {t('pulseBanner.badge')}
                </span>
                <span>{t('pulseBanner.message')}</span>
                <Link href="/reflect/availability" onClick={() => setVisible(false)} className="whitespace-nowrap underline hover:text-emerald-100 transition-colors font-semibold">
                    {t('pulseBanner.updateStatus')}
                </Link>
            </div>
            <button onClick={() => setVisible(false)} className="text-emerald-200 hover:text-white transition-colors p-1" aria-label={t('pulseBanner.close')}>
                <XIcon className="h-5 w-5" />
            </button>
        </div>
    );
}
