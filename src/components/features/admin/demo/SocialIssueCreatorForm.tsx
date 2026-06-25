"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { createDemoSocialIssue } from "@/app/actions/admin/seed";
import { DEMO_ISSUE_CATEGORIES } from "@/types/demo-seed";
import type { SocialIssueCategory } from "@/lib/prisma-shared";
import { StatusMsg } from "./DemoShared";

export function SocialIssueCreatorForm({ onCreated }: Readonly<{ onCreated: () => void }>) {
  const { t } = useTranslation(["admin", "common"]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SocialIssueCategory>("OTHER");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMsg({ type: "error", text: t("demo.titleRequired") });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createDemoSocialIssue({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
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
      setCategory("OTHER");
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
            {t("demo.issueTitle")} *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("demo.issueTitlePlaceholder")}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SocialIssueCategory)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DEMO_ISSUE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.labelKey)}
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
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t("demo.issueDescriptionPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>
      <StatusMsg msg={msg} />
      <Button
        type="submit"
        disabled={busy}
        className="bg-red-600 hover:bg-red-700 text-white text-sm"
      >
        {busy ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <PlusIcon className="h-4 w-4 mr-2" />
        )}
        {t("demo.createIssueButton")}
      </Button>
    </form>
  );
}
