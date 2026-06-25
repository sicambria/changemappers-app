import { getCauseBySlug, getRelatedCauses, getCauseJoinStatus } from '@/app/actions/causes'
import { getLocale } from '@/lib/get-locale'
import { getServerTranslation } from '@/lib/server-i18n'
import { notFound } from 'next/navigation'
import CauseDetailClient from '@/components/features/causes/CauseDetailClient';
import type { CauseDetailData, RelatedCause } from '@/components/features/causes/causeDetail.types';

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getCauseBySlug(slug)
  const { t } = await getServerTranslation('common')
  if (!result.success || !result.data) {
    return { title: t('causes.notFoundTitle') }
  }
  return {
    title: `${result.data.title} | Changemappers`,
    description: result.data.description,
  }
}

// --- Utility helpers ---

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

function parseRefs(websites: string | null): string[] {
    if (!websites) return []
    const match = /refs:(.+)/.exec(websites)
    if (!match) return []
    return match[1].split(',').map(r => r.trim()).filter(Boolean)
}

function parseExternalLinks(websites: string | null): string[] {
    if (!websites) return []
    return websites.split(/[,\s]+/).filter(s => s.startsWith('http'))
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

function getTopicIcon(websites: string | null): string {
    const match = websites?.match(/icon:([^|]+)/)
    return match?.[1] ?? ''
}

export default async function CausePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
    const { slug } = await params
    const lang = await getLocale()

    const result = await getCauseBySlug(slug, lang)
    if (!result.success || !result.data) {
        notFound()
    }

    const raw = result.data
    const domainNum = getDomainNum(raw.websites)
    const rdgNum = getRdgNum(raw.websites)
    const refs = parseRefs(raw.websites)
    const externalLinks = parseExternalLinks(raw.websites)
    const causeIsRdg = isRdg(raw.websites)
    const causeIsSubCause = isSubCause(raw.websites)
    const causeIsTopic = isTopic(raw.websites)
    const topicIcon = getTopicIcon(raw.websites)

    const [relatedResult, initialIsJoined] = await Promise.all([
        rdgNum > 0 ? getRelatedCauses(rdgNum, lang) : Promise.resolve({ success: false as const, data: [] }),
        getCauseJoinStatus(slug),
    ])
    const allRelated: RelatedCause[] = (relatedResult.data ?? []).map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description ?? null,
        websites: c.websites ?? null,
    }))

    const parentRdg: RelatedCause | null = (causeIsSubCause || causeIsTopic)
        ? (allRelated.find(c => isRdg(c.websites)) ?? null)
        : null

    const relatedSubCauses: RelatedCause[] = causeIsRdg
        ? allRelated.filter(c => isSubCause(c.websites))
        : []

    const relatedTopics: RelatedCause[] = causeIsRdg
        ? allRelated.filter(c => isTopic(c.websites))
        : []

    const titleWithoutPrefix = raw.title.replace(/^RDG \d+: /, '')
    const displayTitle = topicIcon ? `${topicIcon} ${titleWithoutPrefix}` : titleWithoutPrefix

    const rdgExplorerUrl = rdgNum > 0
        ? `https://changemappers.org/projects/regenerative-developmental-goals/goals-explorer.html#goal-${rdgNum}`
        : null

    // Serialize cause data (strip non-serializable fields)
    const cause: CauseDetailData = {
        id: raw.id,
        title: raw.title,
        slug: raw.slug,
        description: raw.description ?? null,
        coverImage: raw.coverImage ?? null,
        websites: raw.websites ?? null,
        problems: raw.problems ?? null,
        solutions: raw.solutions ?? null,
        mainCauseUsers: raw.mainCauseUsers.map(u => ({
            id: u.id,
            name: u.name,
            profilePhoto: u.profilePhoto ?? null,
        })),
        interestedUsers: (raw.interestedUsers ?? []).map(u => ({
            id: u.id,
            name: u.name,
            profilePhoto: u.profilePhoto ?? null,
            city: u.city ?? null,
        })),
        supportingCommunities: raw.supportingCommunities.map(c => ({
            id: c.id,
            name: c.name,
            coverImage: c.coverImage ?? null,
            city: c.city ?? null,
        })),
        events: (raw.events ?? []).map(event => ({
            id: event.id,
            title: event.title,
            startDate: event.startDate.toISOString(),
            location: event.location ?? null,
            isOnline: event.isOnline,
        })),
        managers: raw.managers.map(m => ({
            id: m.id,
            name: m.name,
        })),
    }

    return (
        <CauseDetailClient
            cause={cause}
            parentRdg={parentRdg}
            relatedSubCauses={relatedSubCauses}
            relatedTopics={relatedTopics}
            domainNum={domainNum}
            rdgNum={rdgNum}
            refs={refs}
            externalLinks={externalLinks}
            causeIsRdg={causeIsRdg}
            causeIsSubCause={causeIsSubCause}
            causeIsTopic={causeIsTopic}
            displayTitle={displayTitle}
            rdgExplorerUrl={rdgExplorerUrl}
            initialIsJoined={initialIsJoined}
        />
    )
}
