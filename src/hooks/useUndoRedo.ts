'use client';

import { useCallback, useRef, useState } from 'react';

export type HistoryAction<T = unknown> = {
  type: string;
  payload: T;
  inversePayload: T;
  timestamp: number;
};

export interface UseUndoRedoOptions {
  maxHistory?: number;
}

let sessionIdCounter = 0;

export function useUndoRedo<T = unknown>(options: UseUndoRedoOptions = {}) {
  const { maxHistory = 50 } = options;
  const [history, setHistory] = useState<HistoryAction<T>[]>([]);
  const [future, setFuture] = useState<HistoryAction<T>[]>([]);
  const sessionIdRef = useRef<string>(`session-${sessionIdCounter++}`);

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const pushAction = useCallback((action: Omit<HistoryAction<T>, 'timestamp'>) => {
    const fullAction: HistoryAction<T> = {
      ...action,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      const newHistory = [...prev, fullAction];
      if (newHistory.length > maxHistory) {
        return newHistory.slice(-maxHistory);
      }
      return newHistory;
    });

    setFuture([]);

    if (globalThis.window !== undefined) {
      try {
        const sessionKey = `undo-redo-${sessionIdRef.current}`;
        const stored = sessionStorage.getItem(sessionKey);
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [...existing, fullAction].slice(-maxHistory);
        sessionStorage.setItem(sessionKey, JSON.stringify(updated));
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }, [maxHistory]);

  const undo = useCallback((): HistoryAction<T> | null => {
    if (history.length === 0) return null;

    const action = history.at(-1)!;
    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [...prev, action]);

    return action;
  }, [history]);

  const redo = useCallback((): HistoryAction<T> | null => {
    if (future.length === 0) return null;

    const action = future.at(-1)!;
    setFuture(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, action]);

    return action;
  }, [future]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setFuture([]);

    if (globalThis.window !== undefined) {
      try {
        sessionStorage.removeItem(`undo-redo-${sessionIdRef.current}`);
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }, []);

  const restoreFromSession = useCallback(() => {
    if (globalThis.window === undefined) return;

    try {
      const sessionKey = `undo-redo-${sessionIdRef.current}`;
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const actions = JSON.parse(stored) as HistoryAction<T>[];
        setHistory(actions);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, []);

  return {
    history,
    future,
    canUndo,
    canRedo,
    pushAction,
    undo,
    redo,
    clearHistory,
    restoreFromSession,
  };
}
