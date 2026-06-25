'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import {
  AlertTriangleIcon,
  DatabaseIcon,
  TrashIcon,
  RefreshCwIcon,
  GaugeIcon,
  GlobeIcon,
  TentIcon,
  CalendarIcon,
} from 'lucide-react';
import {
  seedNetworkData,
  clearDemoData,
  deletePastEvents,
  getCounts,
  seedBatchDemoCommunities,
  seedBatchDemoEvents,
  deleteBatchDemoCommunities,
  deleteBatchDemoEvents,
  seedBatchDemoWeakSignals,
  seedBatchDemoSocialIssues,
  deleteBatchDemoWeakSignals,
  deleteBatchDemoSocialIssues,
} from '@/app/actions/admin/seed';
import { DemoEntityCreator } from '@/components/features/admin/DemoEntityCreator';

type AdminActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export function AdminDataTab() {
  const { t } = useTranslation(['admin', 'common']);

  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [counts, setCounts] = useState({
    userCount: 0,
    communityCount: 0,
    eventCount: 0,
    signalCount: 0,
    issueCount: 0,
  });

  const fetchCounts = async () => {
    const results = await getCounts();
    setCounts(results);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleAction = async (
    action: () => Promise<AdminActionResult>,
    successMsg: string,
  ) => {
    setSeeding(true);
    setMessage(null);
    try {
      const result = await action();
      if (result.success) {
        setMessage({ type: 'success', text: result.message || successMsg });
        fetchCounts();
      } else {
        setMessage({
          type: 'error',
          text: result.error || t('admin:data.errorOccurred'),
        });
      }
    } catch {
      setMessage({ type: 'error', text: t('admin:data.errorDuringAction') });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            {t("admin:data.databaseAndDemoData")}
          </CardTitle>
          <p className="text-sm text-gray-500">
            {t("admin:data.databaseAndDemoDataDesc")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
            <Button
              onClick={async () => {
                setSeeding(true);
                try {
                  const { adminExportFullDb } =
                    await import("@/app/actions/admin/manage");
                  const res = await adminExportFullDb();
                  if (res.success && res.data) {
                    const blob = new Blob(
                      [JSON.stringify(res.data, null, 2)],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `full_database_export_${new Date().toISOString().split("T")[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    setMessage({
                      type: "success",
                      text: t("admin:data.exportFullDbSuccess"),
                    });
                  } else {
                    setMessage({
                      type: "error",
                      text: t("admin:data.exportError") + res.error,
                    });
                  }
                } catch (e) {
                  const errMessage =
                    e instanceof Error ? e.message : String(e);
                  setMessage({
                    type: "error",
                    text: t("admin:data.exportException") + errMessage,
                  });
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              <DatabaseIcon className="h-4 w-4 mr-2" />
              {t("admin:data.exportFullDb")}
            </Button>

            <label
              className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input shadow-sm h-10 px-4 py-2 ${seeding ? "opacity-50 pointer-events-none" : "hover:bg-accent hover:text-accent-foreground"}`}
            >
              <RefreshCwIcon
                className={`h-4 w-4 mr-2 ${seeding ? "animate-spin" : ""}`}
              />
              {t("admin:data.importFullDb")}
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={seeding}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!confirm(t("admin:data.importWarning"))) {
                    e.target.value = "";
                    return;
                  }
                  setSeeding(true);
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const content = event.target?.result as string;
                      const { adminImportFullDb } =
                        await import("@/app/actions/admin/manage");
                      const res = await adminImportFullDb(content);
                      if (res.success) {
                        setMessage({
                          type: "success",
                          text:
                            res.message || t("admin:data.importSuccess"),
                        });
                        fetchCounts();
                      } else {
                        setMessage({
                          type: "error",
                          text: t("admin:data.importError") + res.error,
                        });
                      }
                    } catch {
                      setMessage({
                        type: "error",
                        text: t("admin:data.invalidJsonFile"),
                      });
                    } finally {
                      setSeeding(false);
                      e.target.value = "";
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>

          {message && (
            <div
              className={`p-4 mb-6 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {message.text}
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {counts.userCount}
              </div>
              <div className="text-sm text-gray-500">
                {t("admin:data.demoUser")}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {counts.communityCount}
              </div>
              <div className="text-sm text-gray-500">
                {t("admin:data.networkOrganizations")}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {counts.eventCount}
              </div>
              <div className="text-sm text-gray-500">
                {t("admin:data.networkEvents")}
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {counts.signalCount}
              </div>
              <div className="text-sm text-gray-500">
                {t("admin:data.weakSignals")}
              </div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {counts.issueCount}
              </div>
              <div className="text-sm text-gray-500">
                {t("admin:data.socialIssues")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() =>
                handleAction(
                  () => seedNetworkData(),
                  t("admin:data.networkDataUploaded"),
                )
              }
              disabled={seeding}
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              {seeding ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DatabaseIcon className="h-4 w-4 mr-2" />
              )}
              {t("admin:data.uploadNetworkData")}
            </Button>

            <Button
              onClick={() => {
                if (confirm(t("admin:data.deletePastEventsConfirm"))) {
                  handleAction(
                    () => deletePastEvents(),
                    t("admin:data.pastEventsDeletedToast"),
                  );
                }
              }}
              disabled={seeding}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {seeding ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CalendarIcon className="h-4 w-4 mr-2" />
              )}
              {t("admin:data.deletePastEvents")}
            </Button>

            <div className="flex-grow flex justify-end gap-4 border-t pt-4 mt-2 border-red-100 dark:border-red-900/20 w-full">
              <Button
                onClick={() => {
                  if (confirm(t("admin:data.deleteNetworkConfirm"))) {
                    handleAction(
                      clearDemoData,
                      t("admin:data.networkDataDeleted"),
                    );
                  }
                }}
                disabled={seeding}
                variant="danger"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {seeding ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                {t("admin:data.deleteNetworkData")}
              </Button>

              <Button
                onClick={async () => {
                  const confirm1 = globalThis.confirm(
                    t("admin:data.fullDbDeleteConfirm1"),
                  );
                  if (!confirm1) return;
                  const confirm2 = globalThis.prompt(
                    t("admin:data.fullDbDeleteConfirm2"),
                  );
                  if (confirm2 !== t("admin:data.deleteKeyword")) {
                    alert(t("admin:data.fullDbDeleteCancelled"));
                    return;
                  }
                  setSeeding(true);
                  try {
                    const { adminResetFullDb } =
                      await import("@/app/actions/admin/manage");
                    const res = await adminResetFullDb();
                    if (res.success) {
                      setMessage({
                        type: "success",
                        text:
                          res.message ||
                          t("admin:data.fullDbDeleteSuccess"),
                      });
                      fetchCounts();
                    } else {
                      setMessage({
                        type: "error",
                        text:
                          res.error || t("admin:data.fullDbDeleteError"),
                      });
                    }
                  } catch (e) {
                    const errMessage =
                      e instanceof Error ? e.message : String(e);
                    setMessage({
                      type: "error",
                      text:
                        t("admin:data.fullDbDeleteException") + errMessage,
                    });
                  } finally {
                    setSeeding(false);
                  }
                }}
                disabled={seeding}
                variant="danger"
                className="bg-red-600 hover:bg-red-700 font-bold tracking-wider"
              >
                {seeding ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <AlertTriangleIcon className="h-4 w-4 mr-2" />
                )}
                {t("admin:data.fullDbDelete")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DemoEntityCreator />

      {/* Batch Global Demo Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeIcon className="h-5 w-5 text-indigo-500" />
            {t("admin:data.batchGlobalDemoData")}
          </CardTitle>
          <p className="text-sm text-gray-500">
            {t("admin:data.batchGlobalDemoDataDescPre")}{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {t("admin:data.demoTag")}
            </code>{" "}
            {t("admin:data.batchGlobalDemoDataDescPost")}
          </p>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`p-4 mb-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {message.text}
            </div>
          )}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <TentIcon className="w-4 h-4 text-emerald-500" />
                {t("admin:data.demoCommunities")}
              </h4>
              <p className="text-xs text-gray-500">
                {t("admin:data.demoCommunitiesLocations")}
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() =>
                    handleAction(
                      seedBatchDemoCommunities,
                      t("admin:data.batchDemoCommunitiesCreated"),
                    )
                  }
                  disabled={seeding}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <DatabaseIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.createX10")}
                </Button>
                <Button
                  onClick={() => {
                    if (
                      confirm(t("admin:data.deleteConfirmDemoCommunities"))
                    ) {
                      handleAction(
                        deleteBatchDemoCommunities,
                        t("admin:data.batchDemoCommunitiesDeleted"),
                      );
                    }
                  }}
                  disabled={seeding}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <TrashIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.delete")}
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-500" />
                {t("admin:data.demoEvents")}
              </h4>
              <p className="text-xs text-gray-500">
                {t("admin:data.demoEventsList")}
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() =>
                    handleAction(
                      seedBatchDemoEvents,
                      t("admin:data.batchDemoEventsCreated"),
                    )
                  }
                  disabled={seeding}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <DatabaseIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.createX10")}
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(t("admin:data.deleteConfirmDemoEvents"))) {
                      handleAction(
                        deleteBatchDemoEvents,
                        t("admin:data.batchDemoEventsDeleted"),
                      );
                    }
                  }}
                  disabled={seeding}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <TrashIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.delete")}
                </Button>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <GaugeIcon className="w-4 h-4 text-amber-500" />
                {t("admin:data.demoWeakSignals")}
              </h4>
              <p className="text-xs text-gray-500">
                {t("admin:data.demoWeakSignalsList")}
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() =>
                    handleAction(
                      seedBatchDemoWeakSignals,
                      t("admin:data.batchDemoWeakSignalsCreated"),
                    )
                  }
                  disabled={seeding}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <DatabaseIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.createX10")}
                </Button>
                <Button
                  onClick={() => {
                    if (
                      confirm(t("admin:data.deleteConfirmDemoWeakSignals"))
                    ) {
                      handleAction(
                        deleteBatchDemoWeakSignals,
                        t("admin:data.batchDemoWeakSignalsDeleted"),
                      );
                    }
                  }}
                  disabled={seeding}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <TrashIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.delete")}
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-red-500" />
                {t("admin:data.demoSocialIssues")}
              </h4>
              <p className="text-xs text-gray-500">
                {t("admin:data.demoSocialIssuesList")}
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() =>
                    handleAction(
                      seedBatchDemoSocialIssues,
                      t("admin:data.batchDemoSocialIssuesCreated"),
                    )
                  }
                  disabled={seeding}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <DatabaseIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.createX10")}
                </Button>
                <Button
                  onClick={() => {
                    if (
                      confirm(t("admin:data.deleteConfirmDemoSocialIssues"))
                    ) {
                      handleAction(
                        deleteBatchDemoSocialIssues,
                        t("admin:data.batchDemoSocialIssuesDeleted"),
                      );
                    }
                  }}
                  disabled={seeding}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                  {seeding ? (
                    <RefreshCwIcon className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <TrashIcon className="h-3 w-3 mr-1" />
                  )}
                  {t("admin:data.delete")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
