// Audit logging utility
// Following NONFUNCTIONAL.MD §2.2 - Audit Naplózás

import { prisma, AuditAction } from './prisma';
import type { Prisma } from './prisma';
import { headers } from 'next/headers';
import { logger } from './logger';
import { getClientIp } from './request-ip';

const REDACTED_AUDIT_VALUE = '[REDACTED]';

const SENSITIVE_AUDIT_KEY_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /cookie/i,
    /session/i,
    /authorization/i,
    /apiKey/i,
    /^email$/i,
    /userEmail/i,
    /recipientEmail/i,
    /contactEmail/i,
    /phone/i,
    /^address$/i,
    /^latitude$/i,
    /^longitude$/i,
    /onlineLink/i,
    /^url$/i,
    /website/i,
    /social/i,
    /message/i,
    /description/i,
    /bio/i,
    /notes?/i,
    /privateNotes/i,
    /reflection/i,
    /content/i,
    /reasoning/i,
];

function shouldRedactAuditKey(key: string): boolean {
    return SENSITIVE_AUDIT_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactAuditJson<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => redactAuditJson(item)) as T;
    }

    if (value instanceof Date) {
        return value.toISOString() as T;
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
                key,
                shouldRedactAuditKey(key) ? REDACTED_AUDIT_VALUE : redactAuditJson(nestedValue),
            ]),
        ) as T;
    }

    return value;
}
interface AuditLogParams {
    userId?: string;
    userEmail?: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

/**
 * Creates an audit log entry for tracking critical operations
 * 
 * @example
 * await createAuditLog({
 *   userId: session.userId,
 *   action: 'DELETE',
 *   entityType: 'Event',
 *   entityId: eventId,
 *   previousState: { title: 'Old Event' },
 * });
 */
export async function createAuditLog(
    params: AuditLogParams,
    tx?: Prisma.TransactionClient,
): Promise<void> {
    const client = tx ?? prisma;
    try {
        // Get request metadata from headers
        const headersList = await headers();
        const ipAddress = getClientIp(headersList);
        const userAgent = headersList.get('user-agent') || 'unknown';

        await client.auditLog.create({
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                previousState: params.previousState === undefined ? undefined : redactAuditJson(params.previousState) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                newState: params.newState === undefined ? undefined : redactAuditJson(params.newState) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                metadata: params.metadata === undefined ? undefined : redactAuditJson(params.metadata) as any,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        // When invoked inside a caller-provided transaction, the audit write is
        // part of an atomicity contract: propagate so the whole $transaction
        // rolls back (AUDIT-20260612-010). Standalone calls keep the original
        // GDPR-M4 behaviour: log and never fail the main operation.
        if (tx) {
            throw error;
        }
        // Log error but don't fail the main operation (GDPR-M4: no raw error objects)
        logger.error({ msg: 'Failed to create audit log', err: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Helper for soft delete with audit logging
 */
export async function softDeleteWithAudit(
    model: 'user' | 'community' | 'event' | 'connection' | 'message',
    id: string,
    userId?: string,
    userEmail?: string
): Promise<void> {
    const now = new Date();

    // Entity write + audit log must be atomic (AUDIT-20260612-010): if the
    // audit log fails, the soft delete rolls back so we never lose traceability.
    await prisma.$transaction(async (tx) => {
        // Get previous state for audit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const previousState = await (tx[model] as any).findUnique({
            where: { id },
            select: { id: true },
        });

        // Perform soft delete
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx[model] as any).update({
            where: { id },
            data: { deletedAt: now },
        });

        // Create audit log (on the same transaction client)
        await createAuditLog({
            userId,
            userEmail,
            action: 'SOFT_DELETE',
            entityType: model.charAt(0).toUpperCase() + model.slice(1),
            entityId: id,
            previousState: previousState ? { ...previousState } : undefined,
            newState: { deletedAt: now.toISOString() },
        }, tx);
    });
}

/**
 * Helper for restore with audit logging
 */
export async function restoreWithAudit(
    model: 'user' | 'community' | 'event' | 'connection' | 'message',
    id: string,
    userId?: string,
    userEmail?: string
): Promise<void> {
    // Entity write + audit log must be atomic (AUDIT-20260612-010).
    await prisma.$transaction(async (tx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx[model] as any).update({
            where: { id },
            data: { deletedAt: null },
        });

        await createAuditLog({
            userId,
            userEmail,
            action: 'RESTORE',
            entityType: model.charAt(0).toUpperCase() + model.slice(1),
            entityId: id,
        }, tx);
    });
}
