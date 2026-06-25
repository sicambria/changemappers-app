'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { verifyEmailAction, resendVerificationEmailAction } from '@/app/actions/auth-recovery';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation('auth');
  const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
    const [message, setMessage] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [email, setEmail] = useState('');

    const verifyToken = async (tokenToVerify: string) => {
        setStatus('loading');
        try {
            const result = await verifyEmailAction(tokenToVerify);
            if (result.success) {
                setStatus('success');
                setMessage(result.message || t('verification.success'));
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(result.error || t('verification.error'));
            }
        } catch {
            setStatus('error');
            setMessage(t('verification.error'));
        }
    };

    useEffect(() => {
        if (token) {
            verifyToken(token);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setResendStatus('loading');
        try {
            const result = await resendVerificationEmailAction(email);
            if (result.success) {
                setResendStatus('success');
            } else {
                setResendStatus('error');
                setMessage(result.error || t('verification.error'));
            }
        } catch {
            setResendStatus('error');
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-gray-600">{t('verification.verifying')}</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center space-y-4">
                <div className="text-emerald-600 text-5xl mb-4">✓</div>
                <h1 className="text-2xl font-bold text-gray-800">{t('verification.successTitle')}</h1>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">{t('verification.redirectNotice')}</p>
                <Link href="/login" className="inline-block mt-4 text-emerald-600 hover:text-emerald-700 font-medium">
                    {t('verification.goToLogin')}
                </Link>
            </div>
        );
    }

    if (status === 'error' && token) {
        return (
            <div className="text-center space-y-4 max-w-md mx-auto">
                <div className="text-red-500 text-5xl mb-4">✕</div>
                <h1 className="text-2xl font-bold text-gray-800">{t('verification.errorTitle')}</h1>
                <p className="text-red-600">{message}</p>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h2 className="text-lg font-semibold mb-2">{t('verification.requestNewTitle')}</h2>
                    <form onSubmit={handleResend} className="space-y-4">
                        <input
                            type="email"
                            placeholder={t('verification.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                        />
                        <button
                            type="submit"
                            disabled={resendStatus === 'loading'}
                            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            {resendStatus === 'loading' ? t('verification.sending') : t('verification.send')}
                        </button>
                    </form>
                    {resendStatus === 'success' && (
                        <p className="mt-2 text-green-600 text-sm">{t('verification.resendSuccess')}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="text-center space-y-6 max-w-md mx-auto">
    <h1 className="text-2xl font-bold text-gray-800">{t('verification.title')}</h1>
    <p className="text-gray-600">
      {t('verification.checkInbox')}
            </p>

            <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800">
      <p className="font-semibold mb-1">{t('verification.demoInfoTitle')}</p>
      <p>{t('verification.demoInfoText')}</p>
            </div>

            <div className="pt-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold mb-2">{t('verification.notReceivedTitle')}</h2>
                <form onSubmit={handleResend} className="space-y-4">
                    <input
                        type="email"
                        placeholder={t('verification.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={resendStatus === 'loading'}
                        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {resendStatus === 'loading' ? t('verification.sending') : t('verification.resendButton')}
                    </button>
                </form>
                {resendStatus === 'success' && (
                    <p className="mt-2 text-green-600 text-sm">{t('verification.resent')}</p>
                )}
            </div>

            <Link href="/" className="inline-block mt-4 text-gray-500 hover:text-gray-700 text-sm">
                {t('verification.backToHome')}
            </Link>
        </div>
    );
}

export default function VerifyEmailPage() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <Suspense fallback={<div>{t('common:actions.loading')}</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
