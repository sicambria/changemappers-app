"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { createDemoEvent } from "@/app/actions/admin/seed";
import { EVENT_CATEGORY_KEYS } from "./demo-entity-config";
import { StatusMsg } from "./DemoShared";

export function EventCreatorForm({ onCreated }: Readonly<{ onCreated: () => void }>) {
  const { t } = useTranslation(["admin", "common"]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("MEETUP");
  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMsg({ type: "error", text: t("demo.titleRequired") });
      return;
    }
    if (!startDate) {
      setMsg({ type: "error", text: t("demo.startDateRequired") });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createDemoEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      category,
      startDate,
      endDate: endDate || undefined,
    });
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.created")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) {
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("MEETUP");
      setStartDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      );
      setEndDate("");
      onCreated();
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.eventName")} *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("demo.eventNamePlaceholder")}
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
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {EVENT_CATEGORY_KEYS.map((ec) => (
              <option key={ec.value} value={ec.value}>
                {t(ec.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.location")}
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("demo.eventLocationPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.startDate")} *
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.endDate")}
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
            placeholder={t("demo.eventDescriptionPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>
      <StatusMsg msg={msg} />
      <Button
        type="submit"
        disabled={busy}
        className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
      >
        {busy ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <PlusIcon className="h-4 w-4 mr-2" />
        )}
        {t("demo.createEventButton")}
      </Button>
    </form>
  );
}
