"use client";

import { useTranslation } from "react-i18next";
import {
  RefreshCwIcon,
  UserPlusIcon,
  BuildingIcon,
  CalendarPlusIcon,
  RadioIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useDemoEntityLists } from "@/hooks/useDemoEntityLists";
import { Section } from "./demo/DemoShared";
import { BatchDemoUsersButton } from "./demo/BatchDemoUsersButton";
import { UserCreatorForm } from "./demo/UserCreatorForm";
import { CommunityCreatorForm } from "./demo/CommunityCreatorForm";
import { EventCreatorForm } from "./demo/EventCreatorForm";
import { WeakSignalCreatorForm } from "./demo/WeakSignalCreatorForm";
import { SocialIssueCreatorForm } from "./demo/SocialIssueCreatorForm";
import {
  UserList,
  CommunityList,
  EventList,
  WeakSignalList,
  SocialIssueList,
} from "./demo/DemoEntityLists";

export function DemoEntityCreator() {
  const { t } = useTranslation(["admin", "common"]);
  const {
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
  } = useDemoEntityLists();

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {t("demo.individualDemoEntities")}
        </h3>
        <button
          type="button"
          onClick={refreshLists}
          disabled={loadingLists}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          <RefreshCwIcon
            className={`h-3.5 w-3.5 ${loadingLists ? "animate-spin" : ""}`}
          />
          {t("demo.refresh")}
        </button>
      </div>

      <BatchDemoUsersButton onDone={refreshLists} />

      <Section
        title={t("demo.newDemoUser")}
        icon={<UserPlusIcon className="h-4 w-4 text-emerald-600" />}
      >
        <UserCreatorForm onCreated={refreshLists} />
      </Section>

      <Section
        title={t("demo.newDemoCommunity")}
        icon={<BuildingIcon className="h-4 w-4 text-blue-600" />}
      >
        <CommunityCreatorForm onCreated={refreshLists} />
      </Section>

      <Section
        title={t("demo.newDemoEvent")}
        icon={<CalendarPlusIcon className="h-4 w-4 text-purple-600" />}
      >
        <EventCreatorForm onCreated={refreshLists} />
      </Section>

      <Section
        title={t("demo.newDemoWeakSignal")}
        icon={<RadioIcon className="h-4 w-4 text-amber-600" />}
      >
        <WeakSignalCreatorForm onCreated={refreshLists} />
      </Section>

      <Section
        title={t("demo.newDemoSocialIssue")}
        icon={<AlertCircleIcon className="h-4 w-4 text-red-600" />}
      >
        <SocialIssueCreatorForm onCreated={refreshLists} />
      </Section>

      <Section
        title={t("demo.demoUsers", { count: users.length })}
        icon={<UserPlusIcon className="h-4 w-4 text-emerald-600" />}
        defaultOpen
      >
        <UserList users={users} onDeleted={removeUser} />
      </Section>

      <Section
        title={t("demo.communities", { count: communities.length })}
        icon={<BuildingIcon className="h-4 w-4 text-blue-600" />}
      >
        <CommunityList communities={communities} onDeleted={removeCommunity} />
      </Section>

      <Section
        title={t("demo.events", { count: events.length })}
        icon={<CalendarPlusIcon className="h-4 w-4 text-purple-600" />}
      >
        <EventList events={events} onDeleted={removeEvent} />
      </Section>

      <Section
        title={t("demo.weakSignals", { count: signals.length })}
        icon={<RadioIcon className="h-4 w-4 text-amber-600" />}
      >
        <WeakSignalList signals={signals} onDeleted={removeSignal} />
      </Section>

      <Section
        title={t("demo.socialIssues", { count: issues.length })}
        icon={<AlertCircleIcon className="h-4 w-4 text-red-600" />}
      >
        <SocialIssueList issues={issues} onDeleted={removeIssue} />
      </Section>
    </div>
  );
}
