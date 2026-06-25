import { getCauses } from '@/app/actions/causes'
import { getLocale } from '@/lib/get-locale'
import { getServerTranslation } from '@/lib/server-i18n'
import CausesPageClient, { GroupedDomain, CauseListItem } from '@/components/features/causes/CausesPageClient'

export const revalidate = 600

export async function generateMetadata() {
  const { t } = await getServerTranslation('common')
  return {
    title: t('causes.metaTitle'),
    description: t('causes.metaDescription'),
  }
}

// Domain visual config (no React components — icons are re-added in the client component)
const DOMAIN_STYLES = [
    {
        num: 1,
        subtitle: 'RDG 1–6',
        color: 'from-emerald-600 to-teal-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        num: 2,
        subtitle: 'RDG 7–12',
        color: 'from-emerald-600 to-green-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        num: 3,
        subtitle: 'RDG 13–18',
        color: 'from-amber-600 to-yellow-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
        num: 4,
        subtitle: 'RDG 19–24',
        color: 'from-cyan-600 to-cyan-600',
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        border: 'border-cyan-200 dark:border-cyan-800',
        badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
        num: 5,
        subtitle: 'RDG 25–30',
        color: 'from-rose-600 to-red-600',
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        border: 'border-rose-200 dark:border-rose-800',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
        iconColor: 'text-rose-600 dark:text-rose-400',
    },
]

function getDomainNum(websites: string | null): number {
    if (!websites) return 0
    const match = /domain:(\d+)/.exec(websites)
    return match ? Number.parseInt(match[1]) : 0
}

function getRdgNum(websites: string | null): number {
    if (!websites) return 0
    const match = /rdg:(\d+)/.exec(websites)
    return match ? Number.parseInt(match[1]) : 0
}

function isTopic(websites: string | null): boolean {
    return websites?.includes('topic:1') ?? false
}

function isSubCause(websites: string | null): boolean {
    return (websites?.includes('sub:1') ?? false) && !isTopic(websites)
}

function isRdg(websites: string | null): boolean {
    return getDomainNum(websites) > 0 && !isTopic(websites) && !isSubCause(websites)
}

interface CauseRaw {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    websites: string | null;
    _count?: { mainCauseUsers?: number; interestedUsers?: number };
}

function toCauseListItem(c: CauseRaw): CauseListItem {
    return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        websites: c.websites,
        mainCauseCount: c._count?.mainCauseUsers ?? 0,
        interestedCount: c._count?.interestedUsers ?? 0,
    }
}

export default async function CausesPage() {
    const lang = await getLocale()
    const result = await getCauses(lang)

    if (!result.success || !result.data) {
        return (
            <CausesPageClient
                error={true}
                grouped={[]}
                topicCauses={[]}
                uncategorized={[]}
                totalMembers={0}
                causesCount={0}
            />
        )
    }

    const causes = result.data

    const rdgCauses = causes.filter(c => isRdg(c.websites))
    const subCauses = causes.filter(c => isSubCause(c.websites))
    const topicCauses = causes.filter(c => isTopic(c.websites))
    const uncategorized = causes.filter(c => getDomainNum(c.websites) === 0)

    const grouped: GroupedDomain[] = DOMAIN_STYLES.map(style => ({
        ...style,
        causes: rdgCauses
            .filter(c => getDomainNum(c.websites) === style.num)
            .sort((a, b) => getRdgNum(a.websites) - getRdgNum(b.websites))
            .map(toCauseListItem),
        subCauses: subCauses
            .filter(c => getDomainNum(c.websites) === style.num)
            .map(toCauseListItem),
    }))

    const totalMembers = causes.reduce(
        (sum, c) => sum + (c._count?.mainCauseUsers ?? 0) + (c._count?.interestedUsers ?? 0),
        0
    )

    return (
        <CausesPageClient
            grouped={grouped}
            topicCauses={topicCauses.map(toCauseListItem)}
            uncategorized={uncategorized.map(toCauseListItem)}
            totalMembers={totalMembers}
            causesCount={causes.length}
        />
    )
}
