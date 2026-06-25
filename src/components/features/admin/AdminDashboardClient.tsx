"use client";

import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { GaugeIcon } from "lucide-react";
import { AdminEntityManager } from "@/components/features/admin/AdminEntityManager";
import { PerformanceTester } from "@/components/features/admin/PerformanceTester";
import { AdminAnalyticsTab } from "@/components/features/admin/AdminAnalyticsTab";
import { AdminRoutesTabWrapper } from "@/components/features/admin/AdminRoutesTab";
import { AdminRegistrationsTab } from "@/components/features/admin/AdminRegistrationsTab";
import { AdminFeedbackTab } from "@/components/features/admin/AdminFeedbackTab";
import { AdminIdeasTab } from "@/components/features/admin/AdminIdeasTab";
import { AdminExperimentalFeaturesTab } from "@/components/features/admin/AdminExperimentalFeaturesTab";
import { AdminOverviewTab } from "@/components/features/admin/AdminOverviewTab";
import { AdminMockReportsTab } from "@/components/features/admin/AdminMockReportsTab";
import { AdminDataTab } from "@/components/features/admin/AdminDataTab";
import {
  adminGetUsers,
  adminGetCommunities,
  adminGetEvents,
  adminUpdateUser,
  adminUpdateCommunity,
  adminUpdateEvent,
} from "@/app/actions/admin/manage";

type Tab =
  | "overview"
  | "reports"
  | "data"
  | "users"
  | "communities"
  | "events"
  | "performance"
  | "analytics"
  | "routes"
  | "registrations"
  | "feedback"
  | "ideas"
  | "experimental";

export function AdminDashboardClient() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const dateLocale = i18n.resolvedLanguage || 'en';
  const formatCreatedAt = (createdAt: string | Date) => new Date(createdAt).toLocaleDateString(dateLocale);

  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) || "overview";

  return (
    <div className="space-y-6">
      {/* Overview Tab */}
      {activeTab === "overview" && <AdminOverviewTab />}

      {/* Reports Tab */}
      {activeTab === "reports" && <AdminMockReportsTab />}

      {/* Data Seeding Tab */}
      {activeTab === "data" && <AdminDataTab />}

      {/* Entity Management Tabs */}
      {activeTab === "users" && (
        <AdminEntityManager
          title={t("admin:manage.users")}
          type="USER"
          fetchData={adminGetUsers}
          updateData={adminUpdateUser}
          filterOptions={{
            status: [
              { value: "active", label: t("admin:manage.filters.active") },
              {
                value: "suspended",
                label: t("admin:manage.filters.suspended"),
              },
            ],
            type: [
              { value: "GUEST", label: "GUEST" },
              { value: "COMMUNITY_SEEKER", label: "COMMUNITY_SEEKER" },
              { value: "CHANGEMAKER", label: "CHANGEMAKER" },
            ],
          }}
          columns={[
            { key: "name", label: t("admin:manage.columns.name") },
            { key: "email", label: t("admin:manage.columns.email") },
            {
              key: "profileType",
              label: t("admin:manage.columns.role"),
              render: (item) => (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${(() => {
                    if (item.profileType === "CHANGEMAPPER") return "bg-purple-100 text-purple-800";
                    if (item.profileType === "COMMUNITY_SEEKER") return "bg-blue-100 text-blue-800";
                    return "bg-gray-100 text-gray-800";
                  })()}`}
                >
                  {item.profileType}
                </span>
              ),
            },
            {
              key: "isModerator",
              label: t("admin:manage.columns.moderator"),
              render: (item) => (
                <span className={(item.isModerator ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700") + " px-2 py-1 text-xs font-semibold rounded-full"}>
                  {item.isModerator ? t("admin:manage.yes") : t("admin:manage.no")}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: t("admin:manage.columns.createdAt"),
              render: (item) => formatCreatedAt(item.createdAt),
            },
          ]}
        />
      )}

      {activeTab === "communities" && (
        <AdminEntityManager
          title={t("admin:manage.communities")}
          type="COMMUNITY"
          fetchData={adminGetCommunities}
          updateData={adminUpdateCommunity}
          filterOptions={{
            status: [
              { value: "approved", label: t("admin:manage.filters.approved") },
              {
                value: "pending",
                label: t("admin:manage.filters.pendingReview"),
              },
              { value: "hidden", label: t("admin:manage.filters.hidden") },
            ],
          }}
          columns={[
            { key: "name", label: t("admin:manage.columns.name") },
            { key: "city", label: t("admin:manage.columns.city") },
            {
              key: "createdAt",
              label: t("admin:manage.columns.createdAt"),
              render: (item) => formatCreatedAt(item.createdAt),
            },
          ]}
        />
      )}

      {activeTab === "events" && (
        <AdminEntityManager
          title={t("admin:manage.events")}
          type="EVENT"
          fetchData={adminGetEvents}
          updateData={adminUpdateEvent}
          filterOptions={{
            status: [
              { value: "UPCOMING", label: t("admin:manage.filters.upcoming") },
              { value: "ONGOING", label: t("admin:manage.filters.ongoing") },
              { value: "ENDED", label: t("admin:manage.filters.ended") },
              {
                value: "CANCELLED",
                label: t("admin:manage.filters.cancelled"),
              },
            ],
            type: [
              { value: "ONLINE", label: "ONLINE" },
              { value: "IN_PERSON", label: "IN_PERSON" },
              { value: "HYBRID", label: "HYBRID" },
            ],
          }}
          columns={[
            { key: "title", label: t("admin:manage.columns.title") },
            { key: "type", label: t("admin:manage.columns.type") },
            {
              key: "status",
              label: t("admin:manage.columns.status"),
              render: (item) => (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${(() => {
                    if (item.status === "UPCOMING") return "bg-blue-100 text-blue-800";
                    if (item.status === "ONGOING") return "bg-emerald-100 text-emerald-800";
                    if (item.status === "ENDED") return "bg-gray-100 text-gray-800";
                    if (item.status === "CANCELLED") return "bg-red-100 text-red-800";
                    return "bg-gray-100 text-gray-800";
                  })()}`}
                >
                  {item.status || "—"}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: t("admin:manage.columns.createdAt"),
              render: (item) => formatCreatedAt(item.createdAt),
            },
          ]}
        />
      )}

      {/* Registrations Tab */}
      {activeTab === "registrations" && <AdminRegistrationsTab />}

      {/* Routes Tab */}
      {activeTab === "routes" && <AdminRoutesTabWrapper />}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeIcon className="h-5 w-5 text-blue-500" />
                {t("admin:perf.title")}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {t("admin:perf.description_short")}
              </p>
            </CardHeader>
            <CardContent>
              <PerformanceTester />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && <AdminAnalyticsTab />}

      {/* Experimental Features Tab */}
      {activeTab === "experimental" && <AdminExperimentalFeaturesTab />}

      {/* Feedback Tab */}
      {activeTab === "feedback" && <AdminFeedbackTab />}

      {/* Community Ideas Tab */}
      {activeTab === "ideas" && <AdminIdeasTab />}
    </div>
  );
}
