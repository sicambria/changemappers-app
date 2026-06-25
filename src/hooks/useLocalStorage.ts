'use client';

import { useState} from 'react';

/**
 * Hook for persisting state to localStorage
 * @param key - localStorage key
 * @param initialValue - Initial value if nothing in localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (globalThis.window === undefined) {
            return initialValue;
        }

        try {
            const item = globalThis.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (err) {
            console.warn(`Error reading localStorage key "${key}":`, err);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (globalThis.window !== undefined) {
                globalThis.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (err) {
            console.warn(`Error setting localStorage key "${key}":`, err);
        }
    };

    return [storedValue, setValue];
}
