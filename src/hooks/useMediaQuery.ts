'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for responsive design with media queries
 * @param query - CSS media query string
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (globalThis.window === undefined) return;

        const media = globalThis.matchMedia(query);

        // Set initial value
        setMatches(media.matches);

        // Create listener
        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Add listener
        media.addEventListener('change', listener);

        return () => {
            media.removeEventListener('change', listener);
        };
    }, [query]);

    return matches;
}

// Preset breakpoints matching Tailwind
export function useIsMobile(): boolean {
    return !useMediaQuery('(min-width: 768px)');
}

export function useIsTablet(): boolean {
    const minMd = useMediaQuery('(min-width: 768px)');
    const minLg = useMediaQuery('(min-width: 1024px)');
    return minMd && !minLg;
}

export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)');
}
