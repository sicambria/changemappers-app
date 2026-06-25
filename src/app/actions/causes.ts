'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import fs from 'node:fs'
import path from 'node:path'
import { getCurrentUser } from './auth'
import { normalizeRdgId, type RdgId } from '@/lib/taxonomy'
import { canEditCause } from '@/lib/permissions'
import { SUPPORTED_LANGUAGES, getLocale } from '@/lib/get-locale'

// AUDIT-20260613-003: `lang` reaches a filesystem path join and the
// unstable_cache key space, so it must be allowlisted at every boundary.
const normalizeCausesLang = (lang: string): string =>
    (SUPPORTED_LANGUAGES as readonly string[]).includes(lang) ? lang : 'en'

// i18n-20260614: When a caller omits `lang`, resolve the *active request* locale
// (authenticated user pref → cookie → Accept-Language → 'en') rather than silently
// defaulting to Hungarian. This is a server action, so `getLocale()` (which reads
// cookies/headers) is valid even when invoked from a client component, and the result
// is resolved BEFORE `unstable_cache` so the cache stays correctly keyed by locale.
// Fixes the cause/RDG-pill Hungarian leak under en-US (callers that pass no lang).
const resolveCausesLang = async (lang?: string): Promise<string> =>
    normalizeCausesLang(lang ?? (await getLocale()))

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CauseUser {
    id: string
    name: string
    profilePhoto: string | null
}

export interface CauseCommunity {
    id: string
    name: string
    coverImage: string | null
    city: string | null
}

export interface CauseManager {
    id: string
    name: string
}

export interface CauseEvent {
    id: string
    title: string
    startDate: Date
    location: string | null
    isOnline: boolean
}


export interface SocialCause {
    title: string
    slug: string
    description: string | null
    coverImage: string | null
    problems: string | null
    solutions: string | null
    websites: string | null
    rdgDomains: string[]
    taxonomyKind?: string
    domainId?: string
    primaryRdgId?: string
    crossRdgIds?: string[]
    neededFunctions: string[]
    _count?: {
        mainCauseUsers: number
        interestedUsers: number
        supportingCommunities: number
    }
    // Database specific fields (for profile page)
    id: string
    mainCauseUsers?: CauseUser[]
    supportingCommunities?: CauseCommunity[]
    interestedUsers?: CauseUser[]
    managers?: CauseManager[]
    events?: CauseEvent[]
}

// ─── JSON Data Loading ──────────────────────────────────────────────────────────

const loadCausesFromJson = (lang: string = 'en'): SocialCause[] => {
    try {
        const safeLang = normalizeCausesLang(lang)
        const filePath = path.join(process.cwd(), 'docs', 'data', safeLang, 'causes.json')
        if (!fs.existsSync(filePath)) {
            // Fallback to English if the requested language file doesn't exist
            const fallbackPath = path.join(process.cwd(), 'docs', 'data', 'en', 'causes.json')
            if (!fs.existsSync(fallbackPath)) return []
            const content = fs.readFileSync(fallbackPath, 'utf8')
            return JSON.parse(content) as SocialCause[]
        }
        const content = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(content) as SocialCause[]
    } catch (error) {
        logActionError('Failed to load causes for language', error, { lang })
        return []
    }
}

// ─── Raw Query Functions ────────────────────────────────────────────────────────

const getCausesRaw = async (lang: string = 'en') => {
    const jsonCauses = loadCausesFromJson(lang)
    
    // Fetch database counts in parallel with other logic if needed, 
    // but here we just have one DB hit.
  const dbCounts = await prisma.socialCause.findMany({
    select: {
      slug: true,
      _count: {
        select: {
          mainCauseUsers: true,
          interestedUsers: true,
          supportingCommunities: true
        },
      },
    },
    take: 200,
  })

    const enriched = jsonCauses.map((jc) => {
        const dbEntry = dbCounts.find(dc => dc.slug === jc.slug)
        const count = dbEntry?._count || {
            mainCauseUsers: 0,
            interestedUsers: 0,
            supportingCommunities: 0
        }
        return {
            ...jc,
            id: jc.slug, // Use slug as stable ID for JSON items
            _count: count
        }
    })

    return { success: true as const, data: enriched }
}

const getCauseBySlugRaw = async (slug: string, lang: string = 'en') => {
    const jsonCauses = loadCausesFromJson(lang)
    const jsonCause = jsonCauses.find(c => c.slug === slug)

    if (!jsonCause) {
        return { success: false as const, error: 'Cause not found in JSON' }
    }

    // Fetch relational data from DB
    const dbCause = await prisma.socialCause.findUnique({
        where: { slug },
        select: {
            id: true,
            mainCauseUsers: {
                select: { id: true, name: true, profilePhoto: true }
            },
            supportingCommunities: {
                select: { id: true, name: true, coverImage: true, city: true }
            },
            interestedUsers: {
                select: { id: true, name: true, profilePhoto: true, city: true },
                take: 24
            },
            managers: {
                select: { id: true, name: true }
            },
            events: {
                where: { event: { deletedAt: null } },
                select: { event: { select: { id: true, title: true, startDate: true, location: true, isOnline: true } } },
                take: 12
            }
        }
    })

    const enriched = {
        ...jsonCause,
        id: dbCause?.id || jsonCause.slug,
        mainCauseUsers: dbCause?.mainCauseUsers || [],
        supportingCommunities: dbCause?.supportingCommunities || [],
        interestedUsers: dbCause?.interestedUsers || [],
        managers: dbCause?.managers || [],
        events: dbCause?.events.map((link) => link.event) || [],
    }

    return { success: true as const, data: enriched }
}

function legacyWebsiteRdgIds(websites: string | null | undefined): string[] {
    const text = websites ?? ''
    const direct = Array.from(text.matchAll(/(?:^|\|)rdg:(\d{1,2})(?=\||$)/g)).map((match) => match[1])
    const cross = Array.from(text.matchAll(/(?:^|\|)xrdg:([0-9,]+)(?=\||$)/g)).flatMap((match) => match[1].split(','))
    return [...direct, ...cross].map((value) => normalizeRdgId(value)).filter((id): id is RdgId => Boolean(id))
}

const getRelatedCausesRaw = async (rdgNum: number, lang: string = 'en') => {
    const jsonCauses = loadCausesFromJson(lang)
    
    const rdgId = normalizeRdgId(rdgNum)
    const filtered = jsonCauses.filter(jc => {
        if (!rdgId) return false
        if (jc.primaryRdgId === rdgId) return true
        if ((jc.crossRdgIds || []).includes(rdgId)) return true
        if (jc.primaryRdgId || (jc.crossRdgIds && jc.crossRdgIds.length > 0)) return false
        return legacyWebsiteRdgIds(jc.websites).includes(rdgId)
    }).map(jc => ({
        ...jc,
        id: jc.slug // Ensure stable ID
    }))

    // Sort by title
    filtered.sort((a, b) => a.title.localeCompare(b.title))

    return { success: true as const, data: filtered }
}

// ─── Cached Queries ────────────────────────────────────────────────────────────

const getCausesCached = unstable_cache(
    (lang: string) => getCausesRaw(lang),
    ['causes-list'],
    { revalidate: 600, tags: ['causes'] }
)

export async function getCauses(lang?: string) {
    try {
        return await getCausesCached(await resolveCausesLang(lang))
    } catch (error) {
        logActionError('Failed to get causes', error)
        return { success: false as const, error: 'Failed to find causes' }
    }
}

const getCauseBySlugCached = unstable_cache(
    (slug: string, lang: string) => getCauseBySlugRaw(slug, lang),
    ['cause-by-slug'],
    { revalidate: 600, tags: ['causes'] }
)

export async function getCauseBySlug(slug: string, lang?: string) {
    try {
        return await getCauseBySlugCached(slug, await resolveCausesLang(lang))
    } catch (error) {
        logActionError('Failed to get cause by slug', error)
        return { success: false as const, error: 'Failed to retrieve cause' }
    }
}

const getRelatedCausesCached = unstable_cache(
    (rdgNum: number, lang: string) => getRelatedCausesRaw(rdgNum, lang),
    ['related-causes'],
    { revalidate: 600, tags: ['causes'] }
)

export async function getRelatedCauses(rdgNum: number, lang?: string) {
    try {
        return await getRelatedCausesCached(rdgNum, await resolveCausesLang(lang))
    } catch (error) {
        logActionError('Failed to get related causes', error)
        return { success: false as const, data: [] as SocialCause[] }
    }
}

// ─── All Causes Slugs (for generateStaticParams) ──────────────────────────────

export async function getAllCauseSlugs(): Promise<string[]> {
    try {
        // Load slugs from English JSON as it's the source of truth for slugs
        const jsonCauses = loadCausesFromJson('en')
        return jsonCauses.map(c => c.slug)
    } catch (error) {
        logActionError('Failed to get cause slugs', error)
        return []
    }
}

// ─── Update Functionality (remains DB-bound but now for relational metadata) ──

export type UpdateCauseInput = {
    description?: string // Not really used if we use JSON, but keeping for DB compatibility
    coverImage?: string
    problems?: string
    solutions?: string
    websites?: string
}

export async function updateCause(slug: string, data: UpdateCauseInput) {
    try {
        const auth = await getCurrentUser()
        if (!auth.success || !auth.data) {
            return { success: false as const, error: 'Not authenticated' }
        }

        const existing = await prisma.socialCause.findUnique({ where: { slug }, select: { id: true } })
        if (!existing || !(await canEditCause(auth.data.user, existing.id))) {
            return { success: false as const, error: 'Forbidden' }
        }

        const cause = await prisma.socialCause.update({
            where: { slug },
            data: {
                coverImage: data.coverImage,
                // These are now in JSON, but we can still store them as backup or if needed
                description: data.description,
                problems: data.problems,
                solutions: data.solutions,
                websites: data.websites,
            }
        })
        revalidateTag('causes', 'default')
        revalidatePath(`/causes/${slug}`)
        revalidatePath('/causes')
        return { success: true as const, data: cause }
    } catch (error) {
        logActionError('Failed to update cause', error)
        return { success: false as const, error: 'Failed to update cause' }
    }
}

// ─── Join / Leave Cause ────────────────────────────────────────────────────────

/**
 * Toggle the current user's membership in a cause's mainCauseUsers.
 * Returns the new joined state.
 */
export async function toggleJoinCause(slug: string): Promise<
    { success: true; joined: boolean } | { success: false; error: string }
> {
    const auth = await getCurrentUser()
    if (!auth.success || !auth.data) {
        return { success: false, error: 'Not authenticated' }
    }
    const userId = auth.data.user.id

    try {
        // Ensure the SocialCause row exists in DB (upsert by slug)
        const causeRow = await prisma.socialCause.upsert({
            where: { slug },
            create: { slug, title: slug },
            update: {},
            select: { id: true, mainCauseUsers: { where: { id: userId }, select: { id: true } } },
        })

        const alreadyJoined = causeRow.mainCauseUsers.length > 0

        await prisma.socialCause.update({
            where: { id: causeRow.id },
            data: {
                mainCauseUsers: alreadyJoined
                    ? { disconnect: { id: userId } }
                    : { connect: { id: userId } },
            },
        })

        revalidateTag('causes', 'default')
        revalidatePath(`/causes/${slug}`)

        return { success: true, joined: !alreadyJoined }
    } catch (error) {
        logActionError('Failed to toggle cause join', error)
        return { success: false, error: 'Failed to update cause membership' }
    }
}

/**
 * Check if the current user has joined a cause.
 */
export async function getCauseJoinStatus(slug: string): Promise<boolean> {
    const auth = await getCurrentUser()
    if (!auth.success || !auth.data) return false
    const userId = auth.data.user.id

    try {
        const count = await prisma.socialCause.count({
            where: { slug, mainCauseUsers: { some: { id: userId } } },
        })
        return count > 0
    } catch {
        return false
    }
}


export async function toggleCauseInterest(slug: string): Promise<
    { success: true; interested: boolean } | { success: false; error: string }
> {
    const auth = await getCurrentUser()
    if (!auth.success || !auth.data) {
        return { success: false, error: 'Not authenticated' }
    }
    const userId = auth.data.user.id

    try {
        const causeRow = await prisma.socialCause.upsert({
            where: { slug },
            create: { slug, title: slug },
            update: {},
            select: { id: true, interestedUsers: { where: { id: userId }, select: { id: true } } },
        })

        const alreadyInterested = causeRow.interestedUsers.length > 0

        await prisma.socialCause.update({
            where: { id: causeRow.id },
            data: {
                interestedUsers: alreadyInterested
                    ? { disconnect: { id: userId } }
                    : { connect: { id: userId } },
            },
        })

        revalidateTag('causes', 'default')
        revalidatePath(`/causes/${slug}`)

        return { success: true, interested: !alreadyInterested }
    } catch (error) {
        logActionError('Failed to toggle cause interest', error)
        return { success: false, error: 'Failed to update cause interest' }
    }
}

export async function getCauseInterestStatus(slug: string): Promise<boolean> {
    const auth = await getCurrentUser()
    if (!auth.success || !auth.data) return false
    const userId = auth.data.user.id

    try {
        const count = await prisma.socialCause.count({
            where: { slug, interestedUsers: { some: { id: userId } } },
        })
        return count > 0
    } catch {
        return false
    }
}

export async function updateCauseStewardAction(slug: string, targetUserId: string, shouldManage: boolean) {
    const auth = await getCurrentUser()
    if (!auth.success || !auth.data) {
        return { success: false as const, error: 'Not authenticated' }
    }

    try {
        const cause = await prisma.socialCause.findUnique({ where: { slug }, select: { id: true } })
        if (!cause || !(await canEditCause(auth.data.user, cause.id))) {
            return { success: false as const, error: 'Forbidden' }
        }

        await prisma.socialCause.update({
            where: { id: cause.id },
            data: {
                managers: shouldManage
                    ? { connect: { id: targetUserId } }
                    : { disconnect: { id: targetUserId } },
            },
        })

        revalidateTag('causes', 'default')
        revalidatePath(`/causes/${slug}`)
        return { success: true as const }
    } catch (error) {
        logActionError('Failed to update cause steward', error)
        return { success: false as const, error: 'Failed to update cause steward' }
    }
}
