'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for debouncing a value
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
