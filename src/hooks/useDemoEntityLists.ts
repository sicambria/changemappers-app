"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listDemoUsers,
  listDemoCommunities,
  listDemoEvents,
  listDemoWeakSignals,
  listDemoSocialIssues,
} from "@/app/actions/admin/seed";
import type {
  DemoUser,
  DemoCommunity,
  DemoEvent,
  DemoWeakSignal,
  DemoSocialIssue,
} from "@/components/features/admin/demo/demo-entity-config";

/**
 * Loads and tracks the lists of demo entities (users, communities, events,
 * weak signals, social issues), with a `refresh` action and per-entity removers
 * for optimistic deletion. Auto-loads on mount.
 */
export function useDemoEntityLists() {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [communities, setCommunities] = useState<DemoCommunity[]>([]);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [signals, setSignals] = useState<DemoWeakSignal[]>([]);
  const [issues, setIssues] = useState<DemoSocialIssue[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const refreshLists = useCallback(async () => {
    setLoadingLists(true);
    const [u, c, e, s, i] = await Promise.all([
      listDemoUsers(),
      listDemoCommunities(),
      listDemoEvents(),
      listDemoWeakSignals(),
      listDemoSocialIssues(),
    ]);
    setUsers((u.data as DemoUser[]) || []);
    setCommunities((c.data as DemoCommunity[]) || []);
    setEvents((e.data as DemoEvent[]) || []);
    setSignals((s.data as DemoWeakSignal[]) || []);
    setIssues((i.data as DemoSocialIssue[]) || []);
    setLoadingLists(false);
  }, []);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const removeUser = useCallback(
    (id: string) => setUsers((prev) => prev.filter((u) => u.id !== id)),
    [],
  );
  const removeCommunity = useCallback(
    (id: string) =>
      setCommunities((prev) => prev.filter((c) => c.id !== id)),
    [],
  );
  const removeEvent = useCallback(
    (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id)),
    [],
  );
  const removeSignal = useCallback(
    (id: string) => setSignals((prev) => prev.filter((s) => s.id !== id)),
    [],
  );
  const removeIssue = useCallback(
    (id: string) => setIssues((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  return {
    users,
    communities,
    events,
    signals,
    issues,
    loadingLists,
    refreshLists,
    removeUser,
    removeCommunity,
    removeEvent,
    removeSignal,
    removeIssue,
  };
}
