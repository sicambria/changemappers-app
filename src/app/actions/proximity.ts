'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { prisma, NotificationType, Visibility } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { createNotificationRecord } from '@/lib/notifications';
import { getPublicMemberWhereInput } from '@/lib/public-member-eligibility';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const NOTIFICATION_RADIUS_KM = 20;
// Bounding-box half-width in degrees (≈22 km) — pre-filters candidates before exact Haversine.
const LAT_DELTA = 0.2;
const LON_DELTA = 0.25; // slightly wider to account for longitude compression at higher latitudes

export async function checkProximityNotificationsAction() {
    try {
        const userResult = await getCurrentUser();
        if (!userResult.success || !userResult.data?.user) return { success: false, error: 'Unauthorized' };

        const currentUser = userResult.data.user;
        if (!currentUser.latitude || !currentUser.longitude) return { success: false, error: 'User location not set' };

        const { latitude, longitude, id: userId } = currentUser;

        const latMin = latitude - LAT_DELTA;
        const latMax = latitude + LAT_DELTA;
        const lonMin = longitude - LON_DELTA;
        const lonMax = longitude + LON_DELTA;

        // Fetch candidates + existing notifications in parallel.
        const [communities, users, existingNotifications] = await Promise.all([
            prisma.community.findMany({
                where: {
                    latitude: { gte: latMin, lte: latMax },
                    longitude: { gte: lonMin, lte: lonMax },
                    deletedAt: null,
                    // Mirror graph.ts:43 — a proximity alert is a push surface, so it must
                    // never announce CONNECTIONS/PRIVATE communities. REGISTERED is allowed
                    // because the recipient is always a logged-in user (AUDIT-20260613-034).
                    visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED] },
                },
                select: { id: true, name: true, latitude: true, longitude: true },
                take: 200,
            }),
            prisma.user.findMany({
                // Reuse the canonical member-eligibility predicate (suspension / pending /
                // verification / onboarding / admin / test-domain exclusions) instead of a
                // hand-rolled subset — the map already does this (map.ts via getPublicMemberWhereInput).
                // The location overrides keep this surface PUBLIC-only: the base allows
                // profileVisibility ∈ {PUBLIC, REGISTERED}, ANDed with `= PUBLIC` it resolves to
                // PUBLIC, and locationVisibility/showOnMap add the per-user location opt-in
                // that communities have no equivalent of (AUDIT-20260613-034).
                where: getPublicMemberWhereInput({
                    id: { not: userId },
                    latitude: { gte: latMin, lte: latMax },
                    longitude: { gte: lonMin, lte: lonMax },
                    profileVisibility: Visibility.PUBLIC,
                    locationVisibility: Visibility.PUBLIC,
                    showOnMap: true,
                }),
                select: { id: true, displayName: true, name: true, latitude: true, longitude: true },
                take: 200,
            }),
            // Single query for all existing proximity alerts — avoids N+1.
    prisma.notification.findMany({
    where: {
      userId,
      type: NotificationType.PROXIMITY_ALERT,
    },
    select: { communityId: true, senderId: true },
    take: 200,
    }),
        ]);

        // Build O(1) lookup sets from the single notifications fetch.
        const notifiedCommunityIds = new Set(
            existingNotifications.filter(n => n.communityId).map(n => n.communityId!)
        );
        const notifiedUserIds = new Set(
            existingNotifications.filter(n => n.senderId).map(n => n.senderId!)
        );

        // Collect notifications to create (exact Haversine check on bounding-box candidates).
        const toCreate: Array<Parameters<typeof createNotificationRecord>[0]> = [];

        for (const community of communities) {
            const distance = getDistanceFromLatLonInKm(latitude, longitude, community.latitude!, community.longitude!);
            if (distance <= NOTIFICATION_RADIUS_KM && !notifiedCommunityIds.has(community.id)) {
                toCreate.push({
                    userId,
                    type: NotificationType.PROXIMITY_ALERT,
                    title: await localizeActionMessage('proximity.communityTitle', { name: community.name }),
                    message: await localizeActionMessage('proximity.communityMessage', { name: community.name, distance: distance.toFixed(1) }),
                    link: `/communities/${community.id}`,
                    communityId: community.id,
                });
            }
        }

        for (const nearbyUser of users) {
            const distance = getDistanceFromLatLonInKm(latitude, longitude, nearbyUser.latitude!, nearbyUser.longitude!);
            if (distance <= NOTIFICATION_RADIUS_KM && !notifiedUserIds.has(nearbyUser.id)) {
                toCreate.push({
                    userId,
                    type: NotificationType.PROXIMITY_ALERT,
                    title: await localizeActionMessage('proximity.userTitle', { name: nearbyUser.displayName || nearbyUser.name }),
                    message: await localizeActionMessage('proximity.userMessage', { name: nearbyUser.displayName || nearbyUser.name, distance: distance.toFixed(1) }),
                    link: `/profile/${nearbyUser.id}`,
                    senderId: nearbyUser.id,
                });
            }
        }

        // Create all new notifications in parallel.
        await Promise.all(toCreate.map(n => createNotificationRecord(n)));

        return { success: true };
    } catch (error) {
        logActionError('Error in proximity notifications', error);
        return { success: false, error: await localizeActionMessage('common.failed') };
    }
}
