import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const availabilitySchema = z.record(z.string(), z.array(z.string()));

export const profileSchema = z.object({
    displayName: z.string().min(2, 'Minimum 2 karakter').max(50),
    bio: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    country: z.string().max(200).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    skills: z.string().optional(),
    offers: z.string().optional(),
    needs: z.string().optional(),
    values: z.string().optional(),
    interests: z.string().optional(),
    website: z.string().optional(),
    socialLinks: z.object({
        linkedin:  z.string().optional(),
        twitter:   z.string().optional(),
        facebook:  z.string().optional(),
        instagram: z.string().optional(),
        youtube:   z.string().optional(),
        github:    z.string().optional(),
        mastodon:  z.string().optional(),
        diaspora:  z.string().optional(),
        pixelfed:  z.string().optional(),
        substack:  z.string().optional(),
        telegram:  z.string().optional(),
    }).optional(),
    // BASE archetypes are mandatory (at least 1 required)
    archetypes: z.array(z.string()).min(1, 'Select at least one base role.'),
    profilePhoto: z.string().optional(),
    coverImage: z.string().optional(),

    // Questionnaire
    isRemoteCapable: z.boolean().optional(),
    enjoyDoing: z.string().optional(),
    currentIntention: z.string().optional(),
    constraints: z.string().optional(),
    availabilityDetails: availabilitySchema.optional(),
    collaborationPreference: z.string().optional(),
    mainCauses: z.array(z.string()).optional(),
    interestedCauses: z.array(z.string()).optional(),

    // Community identity
    mainCommunity: z.string().optional(),

    // Intentions & Boundaries
    seekingLocalEcoCommunity: z.boolean().optional(),
    seekingIntentionalCommunity: z.boolean().optional(),
    highStakesProjectHelp: z.boolean().optional(),
    strictNoRomance: z.boolean().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type AvailabilityMatrix = Record<string, string[]>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAYS = [
    { key: 'H',   label: 'H',   full: 'Monday' },
    { key: 'K',   label: 'K',   full: 'Tuesday' },
    { key: 'Sze', label: 'Sze', full: 'Wednesday' },
    { key: 'Cs',  label: 'Cs',  full: 'Thursday' },
    { key: 'P',   label: 'P',   full: 'Friday' },
    { key: 'Szo', label: 'Szo', full: 'Saturday' },
    { key: 'V',   label: 'V',   full: 'Sunday' },
];

export const TIME_SLOTS = [
    { key: 'reggel',   label: 'Morning',   sub: '8–10' },
    { key: 'de',       label: 'Late morning', sub: '10–12' },
    { key: 'kora_du',  label: 'Early afternoon', sub: '12–15' },
    { key: 'keso_du',  label: 'Late afternoon', sub: '15–18' },
    { key: 'este',     label: 'Evening',    sub: '18–20' },
];

// BASE archetypes — user's functional role, selected manually (mandatory min 1)
export const BASE_ARCHETYPES = [
    { id: 'LOCAL_PRACTITIONER',        icon: '🏡', labelKey: 'localpractitioner' },
    { id: 'NETWORK_WEAVER',            icon: '🕸️', labelKey: 'networkweaver' },
    { id: 'INSTITUTIONAL_CHANGEMAKER', icon: '🏛️', labelKey: 'institutionalchangemaker' },
    { id: 'GLOBAL_AMPLIFIER',          icon: '📢', labelKey: 'globalamplifier' },
    { id: 'RESOURCE_MOBILIZER',        icon: '💰', labelKey: 'resourcemobilizer' },
    { id: 'INNOVATION_CATALYST',       icon: '💡', labelKey: 'innovationcatalyst' },
    { id: 'SYSTEM_DISRUPTOR',          icon: '⚡', labelKey: 'systemdisruptor' },
    { id: 'STRATEGIC_ADVISOR',         icon: '🎯', labelKey: 'strategicadvisor' },
];
export const BASE_ARCHETYPE_IDS = new Set(BASE_ARCHETYPES.map(a => a.id));

// EXTRA archetypes — quiz-calculated regenerative identity (read-only in edit form)
export const EXTRA_ARCHETYPE_ICONS: Record<string, string> = {
    MYCELIUM: '🍄', KEYSTONE: '🪨', POLLINATOR: '🦋', PRISM: '🔮',
    COMPOST: '♻️', SENTINEL: '🔭', ALCHEMIST: '⚗️', CANOPY: '🌳',
    SPARK: '✨', ECHO: '📜', TIDE: '🌊', HORIZON: '🌅',
};

export const SKILLS_OPTIONS    = ['facilitation','projectmanagement','permaculture','coding','cooking','design','marketing','mentoring','translation','eventplanning','writing','research','fundraising','communication','leadership'];
export const OFFERS_OPTIONS    = ['space','tools','time','transport','funding','networking','training'];
export const NEEDS_OPTIONS     = ['connections','support','community','advice','funding','partners','mentoring','space','volunteers','visibility','coFounders'];
export const VALUES_OPTIONS    = ['sustainability','community','socialjustice','spirituality','pragmatism','localfirst','arts','neurodiversity','techoriented','parenting','regenerative','solidarity','transparency','ecology'];
export const INTERESTS_OPTIONS = ['permaculture','transition','activism','ecovillage','sustainability','community','regenerative','education','art','technology','food','health','governance','economics'];
export const COLLAB_OPTIONS    = ['onetwoone','group','occasional','ongoing','remote','inperson'];

// ─── Props ────────────────────────────────────────────────────────────────────

/** Skill rows as fetched for the signed-in profile page. */
export type ProfileSkillEntry = { skill: string; skillType: 'OFFERED' | 'SEEKING' | 'EXPERIENCE' };
/** Legacy rows may be plain strings; current rows are keyed objects. */
export type ProfileValueEntry = string | { value: string };
export type ProfileInterestEntry = string | { interest: string };
export type ProfileCauseRef = string | { id: string; title?: string };
export type ProfileCauseOption = { id: string; title: string };
export type ProfileSocialLinksValue = Partial<Record<
    'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'github' |
    'mastodon' | 'diaspora' | 'pixelfed' | 'substack' | 'telegram',
    string | null
>> & Record<string, string | null | undefined>;

export interface ProfileEditFormProps {
    user: {
        id: string;
        name: string;
        displayName?: string;
        bio?: string;
        location?: string;
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;

        isRemoteCapable?: boolean;
        enjoyDoing?: string;
        currentIntention?: string;
        constraints?: string;
        availabilityDetails?: unknown;
        collaborationPreference?: string[];

        seekingLocalEcoCommunity?: boolean;
        seekingIntentionalCommunity?: boolean;
        highStakesProjectHelp?: boolean;
        strictNoRomance?: boolean;

        skills?: ProfileSkillEntry[];
        values?: ProfileValueEntry[];
        interests?: ProfileInterestEntry[];

        website?: string;
        socialLinks?: ProfileSocialLinksValue | null;
        archetypes?: string[];
        profilePhoto?: string;
        coverImage?: string;
        mainCauses?: ProfileCauseRef[];
        interestedCauses?: ProfileCauseRef[];
        mainCommunity?: string;
    };
    onClose: () => void;
    onSave?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseAvailability(raw: unknown): AvailabilityMatrix {
    if (!raw) return {};
    let obj: unknown = raw;
    if (typeof raw === 'string') {
        try { obj = JSON.parse(raw); } catch { return {}; }
    }
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return {};
    const result: AvailabilityMatrix = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
        if (Array.isArray(val) && val.every(v => typeof v === 'string')) {
            result[key] = val;
        }
    }
    return result;
}
