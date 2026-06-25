/**
 * Entity-image URL contract (AUDIT-20260613-012).
 *
 * Map (and similar list) payloads must never embed base64 image bytes —
 * they reference this route instead, and the browser fetches each image
 * lazily with HTTP caching:
 *
 *   /api/entity-image/<type>/<id>
 *
 * served by src/app/api/entity-image/[type]/[id]/route.ts (registered users
 * only, honoring per-user avatar exposure settings).
 */

export const ENTITY_IMAGE_TYPES = ['user-avatar', 'community-cover', 'event-cover'] as const;
export type EntityImageType = (typeof ENTITY_IMAGE_TYPES)[number];

export function isEntityImageType(value: string): value is EntityImageType {
  return (ENTITY_IMAGE_TYPES as readonly string[]).includes(value);
}

export function entityImageUrl(type: EntityImageType, id: string): string {
  return `/api/entity-image/${type}/${encodeURIComponent(id)}`;
}

/** Matches the relative URLs produced by entityImageUrl (safe for href/css). */
export const ENTITY_IMAGE_URL_RE = /^\/api\/entity-image\/(?:user-avatar|community-cover|event-cover)\/[A-Za-z0-9_-]+$/;

/**
 * Replaces a user-like object's stored `profilePhoto` with a lazily-fetched
 * entity-image URL so LIST payloads never embed base64 image bytes
 * (AUDIT-20260613-012; 2026-06-18 audit C1). A stored photo (data: blob or
 * external URL alike) becomes `/api/entity-image/user-avatar/<id>`, which the
 * route serves to authorized users honoring per-user avatar exposure. A null
 * photo stays null. The field keeps its `profilePhoto` name so consumers that
 * use it as an `<img src>` are unaffected.
 *
 * Use this at every action return that ships a user object inside a collection.
 */
export function withAvatarUrl<T extends { id: string; profilePhoto?: string | null }>(user: T): T {
  if (!user.profilePhoto) return user;
  return { ...user, profilePhoto: entityImageUrl('user-avatar', user.id) };
}

const DATA_URL_RE = /^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,([\w+/=]+)$/;

/**
 * Decodes a stored `data:image/...;base64,` value into bytes + content type.
 * Returns null for anything else (including external https URLs, which the
 * route handles as a redirect instead).
 */
export function decodeStoredImage(stored: string): { contentType: string; bytes: Buffer } | null {
  const match = DATA_URL_RE.exec(stored);
  if (!match) return null;
  return { contentType: match[1], bytes: Buffer.from(match[2], 'base64') };
}
