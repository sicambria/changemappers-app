"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { createDemoWeakSignal } from "@/app/actions/admin/seed";
import { DEMO_SIGNAL_DOMAINS } from "@/types/demo-seed";
import type { SignalDomain } from "@/lib/prisma-shared";
import { StatusMsg } from "./DemoShared";

export function WeakSignalCreatorForm({ onCreated }: Readonly<{ onCreated: () => void }>) {
  const { t } = useTranslation(["admin", "common"]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<SignalDomain>("OTHER");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMsg({ type: "error", text: t("demo.titleRequired") });
      return;
    }
    if (!description.trim()) {
      setMsg({ type: "error", text: t("demo.descriptionRequired") });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createDemoWeakSignal({
      title: title.trim(),
      description: description.trim(),
      domain,
      locationName: locationName.trim() || undefined,
      latitude: latitude ? Number.parseFloat(latitude) : undefined,
      longitude: longitude ? Number.parseFloat(longitude) : undefined,
    });
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.created")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) {
      setTitle("");
      setDescription("");
      setDomain("OTHER");
      setLocationName("");
      setLatitude("");
      setLongitude("");
      onCreated();
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.signalTitle")} *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("demo.signalTitlePlaceholder")}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.description")} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t("demo.signalDescriptionPlaceholder")}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.domain")}
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as SignalDomain)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DEMO_SIGNAL_DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {t(d.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.locationName")}
          </label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder={t("demo.locationPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.latitude")}
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="47.4979"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.longitude")}
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="19.0402"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <StatusMsg msg={msg} />
      <Button
        type="submit"
        disabled={busy}
        className="bg-amber-600 hover:bg-amber-700 text-white text-sm"
      >
        {busy ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <PlusIcon className="h-4 w-4 mr-2" />
        )}
        {t("demo.createSignalButton")}
      </Button>
    </form>
  );
}
