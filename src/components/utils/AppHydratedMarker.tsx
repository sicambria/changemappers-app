'use client';

import { useEffect, useState } from 'react';

/**
 * Renders a hidden marker that signals to E2E tests that React hydration
 * is complete and the application is interactive.
 */
export function AppHydratedMarker() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return <div data-testid="app-hydrated" hidden aria-hidden="true" />;
}
