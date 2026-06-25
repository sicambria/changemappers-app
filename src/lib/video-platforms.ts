/**
 * Multi-platform video URL detection and embed URL generation.
 *
 * Supported platforms:
 *   YouTube, Vimeo, Dailymotion, Wistia, Odysee,
 *   Internet Archive, PeerTube, Wikimedia Commons / Wikipedia
 *
 * Storage strategy: `youtubeLinks` DB field stores full embed URLs.
 * Legacy rows may contain bare 11-char YouTube IDs — see `getEmbedUrl()`.
 */

export type VideoPlatformId =
  | 'youtube'
  | 'vimeo'
  | 'dailymotion'
  | 'wistia'
  | 'odysee'
  | 'archive'
  | 'peertube'
  | 'wikimedia';

export interface VideoEmbed {
  platform: VideoPlatformId;
  /** Ready-to-use embed/src URL */
  embedUrl: string;
  /**
   * true when the URL points to a raw media file (WebM/Ogg).
   * FeedItem should render <video> instead of <iframe> in this case.
   */
  isNativeVideo?: boolean;
}

/** Build the Commons FilePath embed for a raw (URL-encoded) Wikimedia/Wikipedia filename. */
function wikimediaFilePathEmbed(rawFilename: string): VideoEmbed {
  const filename = decodeURIComponent(rawFilename);
  return {
    platform: 'wikimedia',
    embedUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`,
    isNativeVideo: true,
  };
}

function detectOdysee(url: string): VideoEmbed | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'odysee.com' && u.pathname.length > 1) {
      // Already an embed URL
      if (u.pathname.startsWith('/$/embed')) return { platform: 'odysee', embedUrl: url };
      if (!u.pathname.startsWith('/$')) {
        return { platform: 'odysee', embedUrl: `https://odysee.com/$/embed${u.pathname}` };
      }
    }
  } catch {
    // not a valid URL — continue
  }
  return null;
}

function detectPeerTube(url: string): VideoEmbed | null {
  // PeerTube (any instance: /videos/watch/UUID path)
  const m = /\/videos\/watch\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(url);
  if (!m) return null;
  try {
    return { platform: 'peertube', embedUrl: `${new URL(url).origin}/videos/embed/${m[1]}` };
  } catch {
    return null;
  }
}

/**
 * Ordered platform matchers. The first to return a non-null embed wins, so the
 * order here is significant (it mirrors the original sequential checks).
 */
const VIDEO_MATCHERS: ReadonlyArray<(url: string) => VideoEmbed | null> = [
  (url) => {
    const m = /(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
    return m ? { platform: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${m[1]}` } : null;
  },
  (url) => {
    const m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
    return m ? { platform: 'vimeo', embedUrl: `https://player.vimeo.com/video/${m[1]}` } : null;
  },
  (url) => {
    const m = /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/.exec(url);
    return m ? { platform: 'dailymotion', embedUrl: `https://www.dailymotion.com/embed/video/${m[1]}` } : null;
  },
  (url) => {
    const m = /wistia\.(?:com|net)\/(?:medias|embed\/iframe)\/([a-zA-Z0-9]+)/.exec(url);
    return m ? { platform: 'wistia', embedUrl: `https://fast.wistia.net/embed/iframe/${m[1]}` } : null;
  },
  detectOdysee,
  (url) => {
    const m = /archive\.org\/(?:details|embed)\/([^/?#\s]+)/.exec(url);
    return m ? { platform: 'archive', embedUrl: `https://archive.org/embed/${m[1]}` } : null;
  },
  detectPeerTube,
  (url) => {
    const m = /commons\.wikimedia\.org\/wiki\/File:([^?#\s]+)/.exec(url);
    return m ? wikimediaFilePathEmbed(m[1]) : null;
  },
  // Wikipedia File: page (links to Commons)
  (url) => {
    const m = /[a-z]{2,}\.wikipedia\.org\/wiki\/File:([^?#\s]+)/.exec(url);
    return m ? wikimediaFilePathEmbed(m[1]) : null;
  },
];

/** Detect whether a pasted URL is a supported video and return embed info. */
export function detectVideoUrl(inputUrl: string): VideoEmbed | null {
  const url = inputUrl.trim();
  for (const matcher of VIDEO_MATCHERS) {
    const result = matcher(url);
    if (result) return result;
  }
  return null;
}

/**
 * Extract all video embed URLs from Tiptap HTML output.
 *
 * Two sources:
 *  1. Tiptap's built-in YouTube extension  → iframe src="…youtube-nocookie.com/embed/ID"
 *  2. Our custom VideoEmbed node           → div[data-video-embed="URL"]
 */
export function extractVideoUrlsFromContent(html: string): string[] {
  const urls: string[] = [];

  // Source 1 – YouTube (Tiptap built-in extension, kept for backward compat)
  const ytRegex = /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/g;
  let m: RegExpExecArray | null;
  while ((m = ytRegex.exec(html)) !== null) {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${m[1]}`;
    if (!urls.includes(embedUrl)) urls.push(embedUrl);
  }

  // Source 2 – VideoEmbed node (all other platforms + YouTube via new extension)
  const attrRegex = /data-video-embed="([^"]+)"/g;
  while ((m = attrRegex.exec(html)) !== null) {
    const u = m[1];
    if (!urls.includes(u)) urls.push(u);
  }

  return urls;
}

/**
 * Resolve a stored value to an embed URL.
 * Legacy rows store bare 11-char YouTube IDs; new rows store full URLs.
 */
export function getEmbedUrl(stored: string): string {
  if (stored.startsWith('http')) return stored;
  // Legacy: bare YouTube ID
  return `https://www.youtube-nocookie.com/embed/${stored}`;
}

/**
 * Detect the platform from an embed URL (for choosing iframe vs <video>).
 * Falls back gracefully for unknown URLs.
 */
export function getPlatformFromEmbedUrl(embedUrl: string): VideoPlatformId | 'unknown' {
  if (embedUrl.includes('youtube') || embedUrl.includes('youtu.be')) return 'youtube';
  if (embedUrl.includes('vimeo.com')) return 'vimeo';
  if (embedUrl.includes('dailymotion.com')) return 'dailymotion';
  if (embedUrl.includes('wistia')) return 'wistia';
  if (embedUrl.includes('odysee.com')) return 'odysee';
  if (embedUrl.includes('archive.org')) return 'archive';
  if (embedUrl.includes('wikimedia.org') || embedUrl.includes('wikipedia.org')) return 'wikimedia';
  if (embedUrl.includes('/videos/embed/')) return 'peertube';
  return 'unknown';
}

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  dailymotion: 'Dailymotion',
  wistia: 'Wistia',
  odysee: 'Odysee',
  archive: 'Internet Archive',
  peertube: 'PeerTube',
  wikimedia: 'Wikimedia',
};
