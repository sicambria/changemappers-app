import { BadgeCheck, ShieldCheck, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { VerificationLevel } from "@/lib/prisma-shared";


interface VerificationBadgeProps {
    level: VerificationLevel;
    showLabel?: boolean;
    className?: string;
    size?: number;
}

export function VerificationBadge({ level, showLabel = false, className = "", size = 20 }: Readonly<VerificationBadgeProps>) {
    const { t } = useTranslation("profiles");

    if (level === "SELF_DECLARED") {
        return null; // Don't show anything for default level
    }

    let icon = <BadgeCheck size={size} />;
    let colorClass = "text-blue-500";
    let labelKey = "levels.peerVouched";
    let tooltipKey = "levels.peerVouched";

    switch (level) {
        case "PEER_VOUCHED":
            icon = <BadgeCheck size={size} />;
            colorClass = "text-amber-600"; // Bronze-ish (labelKey/tooltipKey already default to peerVouched)
            break;
        case "COMMUNITY_VERIFIED":
            icon = <ShieldCheck size={size} />;
            colorClass = "text-emerald-600"; // Silver/Green
            labelKey = "levels.communityVerified";
            tooltipKey = "levels.communityVerified";
            break;
        case "ADMIN_VERIFIED":
            icon = <Star size={size} fill="currentColor" />;
            colorClass = "text-yellow-500"; // Gold
            labelKey = "levels.adminVerified";
            tooltipKey = "levels.adminVerified";
            break;
    }

    return (
        <div className={`inline-flex items-center gap-1 ${colorClass} ${className}`} title={t(`individual.verification.${tooltipKey}`)}>
            {icon}
            {showLabel && <span className="text-sm font-medium">{t(`individual.verification.${labelKey}`)}</span>}
        </div>
    );
}

// Fallback for when Prisma types aren't available in client components immediately
// or if we want to use string literals
export type VerificationLevelString = "SELF_DECLARED" | "PEER_VOUCHED" | "COMMUNITY_VERIFIED" | "ADMIN_VERIFIED";
