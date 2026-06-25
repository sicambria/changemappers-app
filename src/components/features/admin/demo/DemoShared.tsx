"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: Readonly<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
          {icon} {title}
        </span>
        {open ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export function StatusMsg({
  msg,
}: Readonly<{
  msg: { type: "success" | "error"; text: string } | null;
}>) {
  if (!msg) return null;
  return (
    <div
      className={`text-sm px-3 py-2 rounded-lg ${msg.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}
    >
      {msg.text}
    </div>
  );
}
