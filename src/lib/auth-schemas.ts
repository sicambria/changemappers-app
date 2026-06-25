import { z } from 'zod';
import { isValidDidKey } from '@/lib/did';
import { authT } from '@/lib/auth-localization';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    displayName?: string;
    invitationCode?: string;
    primaryLanguage?: string;
    spokenLanguages?: string[];
    // Location
    country?: string;
    city?: string;
    isRemoteCapable?: boolean;
    // Questionnaire
    enjoyDoing?: string;
    currentIntention?: string;
    collaborationPreference?: string[];
    constraints?: string;
    availabilityDetails?: unknown;
    // Lists
    skills?: string[];
    offers?: string[];
    needs?: string[];
    values?: string[];
    // Settings
    profileVisibility?: string;
    bio: string;
    profilePhoto: string;
    termsAccepted: boolean;
    confirmedAge16Plus: boolean;
    didPublicKey?: string;
}

// Validation schemas
export const loginSchema = z.object({
    email: z.email('server.errors.invalidEmail'),
    password: z.string().min(8, 'server.errors.invalidPassword'),
});

export const passwordSchema = z.string()
    .min(12, 'server.errors.passwordMin')
    .regex(/[A-Z]/, 'server.errors.passwordUppercase')
    .regex(/[a-z]/, 'server.errors.passwordLowercase')
    .regex(/\d/, 'server.errors.passwordNumber')
    .regex(/[^A-Za-z0-9]/, 'server.errors.passwordSpecial');

export const registerSchema = z.object({
    email: z.email('server.errors.invalidEmail'),
    password: passwordSchema,
    name: z.string().min(2, 'server.errors.nameMin').max(100),
    displayName: z.string().optional(),
    invitationCode: z.string().optional().default(''),
    primaryLanguage: z.string().optional(),
    spokenLanguages: z.array(z.string()).optional(),
    termsAccepted: z.literal(true, { error: 'server.errors.termsRequired' }),
    confirmedAge16Plus: z.literal(true, { error: 'server.errors.ageRequired' }),
    didPublicKey: z.string().refine(isValidDidKey, 'server.errors.didInvalid').optional(),
});

export function isPrismaUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

export function registerNeutralResponse(lang: string) {
    return {
        success: true as const,
        message: authT(lang, 'server.errors.registrationContinueNeutral'),
        pendingApproval: true,
    };
}
