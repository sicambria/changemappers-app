"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import {
  TrashIcon,
  RefreshCwIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  seedBatchDemoUsers,
  deleteBatchDemoUsers,
} from "@/app/actions/admin/seed";
import type { BatchResult } from "./demo-entity-config";

export function BatchDemoUsersButton({ onDone }: Readonly<{ onDone: () => void }>) {
  const { t } = useTranslation(["admin", "common"]);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<BatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!confirm(t("demo.batchConfirm"))) return;
    setBusy(true);
    setResults(null);
    setError(null);
    const res = await seedBatchDemoUsers();
    if (res.success) {
      setResults((res.results as BatchResult[]) ?? []);
      onDone();
    } else {
      setError(res.error ?? t("demo.unknownError"));
    }
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!confirm(t("demo.deleteBatchConfirm"))) return;
    setDeleting(true);
    setError(null);
    const res = await deleteBatchDemoUsers();
    if (res.success) {
      onDone();
    } else {
      setError(res.error ?? t("demo.unknownError"));
    }
    setDeleting(false);
  };

  const created = results?.filter((r) => r.status === "created").length ?? 0;
  const skipped = results?.filter((r) => r.status === "skipped").length ?? 0;

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            {t("demo.batchTitle")}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            {t("demo.batchDescription")}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSeed}
          disabled={busy || deleting}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-sm whitespace-nowrap"
        >
          {busy ? (
            <>
              <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
              {t("demo.creating")}
            </>
          ) : (
            <>
              <UsersIcon className="h-4 w-4 mr-2" />
              {t("demo.batchCreateButton")}
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          disabled={busy || deleting}
          variant="outline"
          className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 text-sm whitespace-nowrap"
        >
          {deleting ? (
            <>
              <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
              {t("demo.deleting")}
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-2" />
              {t("demo.deleteBatchButton")}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
          <XCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
            {created > 0 && (
              <span className="text-green-700 dark:text-green-400">
                {t("demo.createdCount", { count: created })}
              </span>
            )}
            {created > 0 && skipped > 0 && (
              <span className="text-gray-400 mx-1">·</span>
            )}
            {skipped > 0 && (
              <span className="text-gray-500">
                {t("demo.skippedCount", { count: skipped })}
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {results.map((r) => (
              <div key={r.email} className="flex items-center gap-1.5 text-xs">
                {r.status === "created" ? (
                  <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <XCircleIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                )}
                <span
                  className={
                    r.status === "created"
                      ? "text-gray-800 dark:text-gray-200"
                      : "text-gray-400 line-through"
                  }
                >
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
