'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/nextjs';

interface SegmentErrorFallbackProps {
	error: Error & { digest?: string };
	reset: () => void;
	homeLabel?: string;
}

export default function SegmentErrorFallback({ error, reset, homeLabel }: Readonly<SegmentErrorFallbackProps>) {
	const { t } = useTranslation('common');

	useEffect(() => {
		// AUDIT-20260612-011: route boundary-caught render errors to Sentry. This
		// shared fallback backs 47 of 51 segment error.tsx boundaries, so capturing
		// here centrally closes the client-side logging gap for those segments.
		Sentry.captureException(error);
		console.error('Segment error:', error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
			<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
				{t('errors.generic', 'An error occurred. Please try again.')}
			</h2>
			<p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
				{error.message || t('errors.unexpectedDescription', 'An unexpected error occurred. Please try again, or go back to the main page.')}
			</p>
			<div className="flex gap-3">
				<button
					onClick={reset}
					className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
				>
					{t('actions.retry', 'Retry')}
				</button>
				<Link
					href={homeLabel ? '/' : '/dashboard'}
					className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				>
					{homeLabel ? t('nav.home', 'Home') : t('nav.dashboard', 'Dashboard')}
				</Link>
			</div>
		</div>
	);
}
