'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// global-error renders outside the Next.js root layout — no context providers
// (Router, i18n, theme) are available. Hardcoded strings are intentional here.
export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: '#f9fafb',
            color: '#111827',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ maxWidth: '28rem', color: '#6b7280', margin: 0 }}>
            An unexpected error occurred. Please try again or return to the homepage.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={reset}
              style={{
                borderRadius: '0.375rem',
                background: '#059669',
                color: '#fff',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders outside the Next.js router; <Link> requires the router which may be unavailable during a root layout crash */}
            <a
              href="/"
              style={{
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                textDecoration: 'none',
              }}
            >
              Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
