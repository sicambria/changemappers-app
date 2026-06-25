"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCwIcon, TrashIcon } from "lucide-react";
import {
  deleteDemoUser,
  deleteDemoCommunity,
  deleteDemoEvent,
  deleteDemoWeakSignal,
  deleteDemoSocialIssue,
} from "@/app/actions/admin/seed";
import { StatusMsg } from "./DemoShared";
import type {
  DemoUser,
  DemoCommunity,
  DemoEvent,
  DemoWeakSignal,
  DemoSocialIssue,
} from "./demo-entity-config";

export function UserList({
  users,
  onDeleted,
}: Readonly<{
  users: DemoUser[];
  onDeleted: (id: string) => void;
}>) {
  const { t } = useTranslation(["admin", "common"]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("demo.confirmDelete", { name }))) return;
    setDeleting(id);
    const res = await deleteDemoUser(id);
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.deleted")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) onDeleted(id);
    setDeleting(null);
  };

  if (users.length === 0)
    return (
      <p className="text-sm text-gray-400 italic">{t("demo.noDemoUsers")}</p>
    );
  return (
    <div className="space-y-1">
      <StatusMsg msg={msg} />
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {u.name}
            </span>
            {u.city && (
              <span className="text-xs text-gray-400 ml-2">— {u.city}</span>
            )}
            <span className="block text-xs text-gray-400">{u.email}</span>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(u.id, u.name)}
            disabled={deleting === u.id}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50"
          >
            {deleting === u.id ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

export function CommunityList({
  communities,
  onDeleted,
}: Readonly<{
  communities: DemoCommunity[];
  onDeleted: (id: string) => void;
}>) {
  const { t } = useTranslation(["admin", "common"]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("demo.confirmDelete", { name }))) return;
    setDeleting(id);
    const res = await deleteDemoCommunity(id);
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.deleted")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) onDeleted(id);
    setDeleting(null);
  };

  if (communities.length === 0)
    return (
      <p className="text-sm text-gray-400 italic">{t("demo.noCommunities")}</p>
    );
  return (
    <div className="space-y-1">
      <StatusMsg msg={msg} />
      {communities.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {c.name}
            </span>
            {c.city && (
              <span className="text-xs text-gray-400 ml-2">— {c.city}</span>
            )}
            <span className="block text-xs text-gray-400">{c.type}</span>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(c.id, c.name)}
            disabled={deleting === c.id}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50"
          >
            {deleting === c.id ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

export function EventList({
  events,
  onDeleted,
}: Readonly<{
  events: DemoEvent[];
  onDeleted: (id: string) => void;
}>) {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t("demo.confirmDelete", { name: title }))) return;
    setDeleting(id);
    const res = await deleteDemoEvent(id);
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.deleted")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) onDeleted(id);
    setDeleting(null);
  };

  if (events.length === 0)
    return <p className="text-sm text-gray-400 italic">{t("demo.noEvents")}</p>;
  return (
    <div className="space-y-1">
      <StatusMsg msg={msg} />
      {events.map((ev) => (
        <div
          key={ev.id}
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {ev.title}
            </span>
            {ev.location && (
              <span className="text-xs text-gray-400 ml-2">
                — {ev.location}
              </span>
            )}
            <span className="block text-xs text-gray-400">
              {new Date(ev.startDate).toLocaleDateString(i18n.language)} ·{" "}
              {t(
                `demo.eventCategories.${ev.category.toLowerCase()}`,
                ev.category,
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(ev.id, ev.title)}
            disabled={deleting === ev.id}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50"
          >
            {deleting === ev.id ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

export function WeakSignalList({
  signals,
  onDeleted,
}: Readonly<{
  signals: DemoWeakSignal[];
  onDeleted: (id: string) => void;
}>) {
  const { t } = useTranslation(["admin", "common"]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t("demo.confirmDelete", { name: title }))) return;
    setDeleting(id);
    const res = await deleteDemoWeakSignal(id);
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.deleted")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) onDeleted(id);
    setDeleting(null);
  };

  if (signals.length === 0)
    return (
      <p className="text-sm text-gray-400 italic">{t("demo.noSignals")}</p>
    );
  return (
    <div className="space-y-1">
      <StatusMsg msg={msg} />
      {signals.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {s.title}
            </span>
            {s.locationName && (
              <span className="text-xs text-gray-400 ml-2">
                — {s.locationName}
              </span>
            )}
            <span className="block text-xs text-gray-400">
              {t(`demo.signalDomains.${s.domain.toLowerCase()}`, s.domain)} ·{" "}
              {s.confidence}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(s.id, s.title)}
            disabled={deleting === s.id}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50"
          >
            {deleting === s.id ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

export function SocialIssueList({
  issues,
  onDeleted,
}: Readonly<{
  issues: DemoSocialIssue[];
  onDeleted: (id: string) => void;
}>) {
  const { t } = useTranslation(["admin", "common"]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t("demo.confirmDelete", { name: title }))) return;
    setDeleting(id);
    const res = await deleteDemoSocialIssue(id);
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.deleted")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) onDeleted(id);
    setDeleting(null);
  };

  if (issues.length === 0)
    return <p className="text-sm text-gray-400 italic">{t("demo.noIssues")}</p>;
  return (
    <div className="space-y-1">
      <StatusMsg msg={msg} />
      {issues.map((i) => (
        <div
          key={i.id}
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {i.title}
            </span>
            {i.locationName && (
              <span className="text-xs text-gray-400 ml-2">
                — {i.locationName}
              </span>
            )}
            <span className="block text-xs text-gray-400">
              {t(
                `demo.issueCategories.${i.category.toLowerCase()}`,
                i.category,
              )}{" "}
              · {i.severity}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(i.id, i.title)}
            disabled={deleting === i.id}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50"
          >
            {deleting === i.id ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
