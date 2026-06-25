"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { createDemoCommunity } from "@/app/actions/admin/seed";
import { COMMUNITY_TYPE_KEYS } from "./demo-entity-config";
import { StatusMsg } from "./DemoShared";

export function CommunityCreatorForm({ onCreated }: Readonly<{ onCreated: () => void }>) {
  const { t } = useTranslation(["admin", "common"]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("INCLUSIVE_SUPPORT_NETWORK");
  const [city, setCity] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg({ type: "error", text: t("demo.nameRequired") });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createDemoCommunity({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      city: city.trim() || undefined,
    });
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.created")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) {
      setName("");
      setDescription("");
      setType("INCLUSIVE_SUPPORT_NETWORK");
      setCity("");
      onCreated();
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.communityName")} *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("demo.communityNamePlaceholder")}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.location")}
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("demo.locationPlaceholderCommunity")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.type")}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {COMMUNITY_TYPE_KEYS.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {t(ct.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t("demo.communityDescriptionPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>
      <StatusMsg msg={msg} />
      <Button
        type="submit"
        disabled={busy}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
      >
        {busy ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <PlusIcon className="h-4 w-4 mr-2" />
        )}
        {t("demo.createCommunityButton")}
      </Button>
    </form>
  );
}
