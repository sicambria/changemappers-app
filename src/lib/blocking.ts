import prisma, { ConnectionStatus, type Prisma } from '@/lib/prisma';

/**
 * Block visibility is SYMMETRIC: if either user has BLOCKED the other, neither
 * may view the other's profile or surface in the other's search/map results.
 * This mirrors the bidirectional BLOCKED checks already used for messaging
 * (`message.ts`), video (`video.ts`), and connection requests (`connection.ts`).
 *
 * A block is encoded directionally on the Connection row — `senderId` is the
 * blocker, `receiverId` the blocked (`blockUserAction`, user.ts) — so the
 * symmetric check is "a BLOCKED row exists in either direction".
 */

/**
 * True when `userA` and `userB` have a BLOCKED connection in either direction.
 * Returns false for the self case (a user is never blocked from themselves).
 */
export async function isBlockedBetween(userA: string, userB: string): Promise<boolean> {
    if (userA === userB) return false;
    const block = await prisma.connection.findFirst({
        where: {
            status: ConnectionStatus.BLOCKED,
            OR: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA },
            ],
        },
        select: { id: true },
    });
    return block !== null;
}

/**
 * The set of user ids BLOCKED in either direction relative to `viewerId`.
 * Use to post-filter a viewer-independent (cached) result set such as the map,
 * where a per-viewer `where` clause is not available.
 */
export async function getBlockedUserIds(viewerId: string): Promise<Set<string>> {
    const rows = await prisma.connection.findMany({
        where: {
            status: ConnectionStatus.BLOCKED,
            OR: [{ senderId: viewerId }, { receiverId: viewerId }],
        },
        select: { senderId: true, receiverId: true },
    });
    const blocked = new Set<string>();
    for (const row of rows) {
        blocked.add(row.senderId === viewerId ? row.receiverId : row.senderId);
    }
    return blocked;
}

/**
 * A `UserWhereInput` fragment that excludes any user who is BLOCKED in either
 * direction relative to `viewerId`. Compose into a candidate-user query (search,
 * discovery) so blocked accounts never appear in either party's results.
 */
export function excludeBlockedUsersWhereInput(viewerId: string): Prisma.UserWhereInput {
    return {
        NOT: {
            OR: [
                // The candidate blocked the viewer.
                { sentConnections: { some: { receiverId: viewerId, status: ConnectionStatus.BLOCKED } } },
                // The viewer blocked the candidate.
                { receivedConnections: { some: { senderId: viewerId, status: ConnectionStatus.BLOCKED } } },
            ],
        },
    };
}
