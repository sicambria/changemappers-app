import { ENTITY_IMAGE_URL_RE } from '@/lib/entity-image';

/**
 * Returns a safe avatar URL for use inside a CSS `url()` / style value, or null.
 * Trusted forms: `data:image/…;base64,…`, `https://` URLs, and same-origin
 * `/api/entity-image/...` paths (AUDIT-20260613-012 — list payloads reference
 * the image route instead of embedding bytes).
 * Single-quotes in HTTPS URLs are percent-encoded to prevent CSS break-out.
 */
export function safeAvatarCssUrl(avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    if (/^data:image\/(jpeg|jpg|png|gif|webp);base64,[\w+/=]+$/.test(avatar)) {
        return avatar;
    }
    if (ENTITY_IMAGE_URL_RE.test(avatar)) {
        return avatar;
    }
    try {
        const url = new URL(avatar);
        if (url.protocol === 'https:') return avatar.replaceAll("'", '%27');
    } catch { /* not a valid URL */ }
    return null;
}
