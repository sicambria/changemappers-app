'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const CONSENT_KEY = 'changemappers-consent';

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export function usePageVisitTracking(isAuthenticated: boolean) {
  const pathname = usePathname();
  // Track consent reactively: re-evaluate when consent-updated fires.
  const consentRef = useRef(false);

  useEffect(() => {
    consentRef.current = hasAnalyticsConsent();

    const onConsentUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ analytics?: boolean }>).detail;
      consentRef.current = detail?.analytics === true;
    };
    globalThis.addEventListener('consent-updated', onConsentUpdate);
    return () => globalThis.removeEventListener('consent-updated', onConsentUpdate);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!hasAnalyticsConsent()) return;

    // Use sessionStorage so the dedup key survives router refreshes that
    // unmount/remount this component — preventing an infinite tracking loop
    // that occurred when calling a server action (which triggered automatic
    // router cache invalidation → remount → ref reset → track again).
    const key = `visited:${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage unavailable (e.g. private browsing with strict settings)
    }

    // Use a plain fetch instead of a server action so Next.js does NOT
    // auto-refresh the router cache after the call completes.
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
    }).catch((error: unknown) => {
      console.warn('[usePageVisitTracking] Failed to track page visit', error);
    });
  }, [pathname, isAuthenticated]);
}
