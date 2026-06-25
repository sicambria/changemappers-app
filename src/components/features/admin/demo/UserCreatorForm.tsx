"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { createDemoUser } from "@/app/actions/admin/seed";
import { ARCHETYPES } from "./demo-entity-config";
import { StatusMsg } from "./DemoShared";

export function UserCreatorForm({ onCreated }: Readonly<{ onCreated: () => void }>) {
  const { t } = useTranslation(["admin", "common"]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [archetypes, setArchetypes] = useState<string[]>([]);

  const toggleArchetype = (a: string) => {
    setArchetypes((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg({ type: "error", text: t("demo.nameRequired") });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createDemoUser({
      name: name.trim(),
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      city: city.trim() || undefined,
      archetypes,
    });
    const msgType = res.success ? ("success" as const) : ("error" as const);
    const msgText = res.success
      ? res.message || t("demo.created")
      : res.error || t("demo.error");
    setMsg({ type: msgType, text: msgText });
    if (res.success) {
      setName("");
      setDisplayName("");
      setBio("");
      setCity("");
      setArchetypes([]);
      onCreated();
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.fullName")} *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("demo.fullNamePlaceholder")}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.displayName")}
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("demo.displayNamePlaceholder")}
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
            placeholder={t("demo.locationPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("demo.bio")}
          </label>
          <input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("demo.bioPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {t("demo.archetypes")}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ARCHETYPES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleArchetype(a)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${archetypes.includes(a) ? "bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"}`}
            >
              {t(`admin:analytics.archetypes.${a}`, a)}
            </button>
          ))}
        </div>
      </div>
      <StatusMsg msg={msg} />
      <Button
        type="submit"
        disabled={busy}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
      >
        {busy ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <PlusIcon className="h-4 w-4 mr-2" />
        )}
        {t("demo.createUserButton")}
      </Button>
    </form>
  );
}
