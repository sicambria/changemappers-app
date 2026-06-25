import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import RSSParser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';

const MAX_REDIRECTS = 3;
const MAX_RSS_BYTES = 1_000_000;
const ALLOWED_PORTS = new Set(['', '80', '443', '8080']);

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^192\.0\.0\./,
  /^198\.(1[89])\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^::1$/,
  /^::$/,
  /^(fc|fd)[0-9a-f]{2}:/,
  /^fe80:/,
];

function hasAlternativeNumericIpForm(hostname: string): boolean {
  return /^(0x|0\d|\d+$)/i.test(hostname);
}

function isPrivateAddress(value: string): boolean {
  const normalized = value.toLowerCase().replaceAll(/(?:^\[)|(?:]$)/g, '');
  if (!normalized || normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
  if (hasAlternativeNumericIpForm(normalized)) return true;
  if (isIP(normalized) === 0) return false;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(normalized));
}

function parseAllowedUrl(urlString: string): URL {
  const url = new URL(urlString);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('disallowed protocol');
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new Error('disallowed port');
  }
  if (isPrivateAddress(url.hostname)) {
    throw new Error('private or local hostname');
  }
  return url;
}

async function assertPublicResolvedHost(hostname: string): Promise<void> {
  if (isIP(hostname) !== 0) {
    if (isPrivateAddress(hostname)) throw new Error('private literal address');
    return;
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error('hostname resolves to a private or local address');
  }
}

async function validateFetchTarget(urlString: string): Promise<URL> {
  const url = parseAllowedUrl(urlString);
  await assertPublicResolvedHost(url.hostname);
  return url;
}

async function fetchWithValidatedRedirects(urlString: string, signal: AbortSignal, redirects = 0): Promise<Response> {
  const url = await validateFetchTarget(urlString);
  const response = await fetch(url.toString(), {
    signal,
    redirect: 'manual',
    headers: {
      'User-Agent': 'Changemappers-RSS-Reader/1.0',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) {
      throw new Error(`Redirect without Location for ${url.toString()}`);
    }
    if (redirects >= MAX_REDIRECTS) {
      throw new Error(`Too many RSS redirects for ${url.toString()}`);
    }
    return fetchWithValidatedRedirects(new URL(location, url).toString(), signal, redirects + 1);
  }

  return response;
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'pre', 'code',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
};

export interface ParsedRSSItem {
  title: string | null;
  content: string;
  plainText: string;
  url: string | null;
  publishedAt: Date | null;
  author: string | null;
  imageUrls: string[];
}

export interface RSSFeedConfig {
  url: string;
  name: string;
  maxItems?: number;
}

const parser = new RSSParser({
  customFields: {
    item: [
      ['content:encoded', 'content:encoded'],
      ['dc:creator', 'dc:creator'],
      ['dc:date', 'dc:date'],
    ],
  },
});

export async function fetchRSSFeed(config: RSSFeedConfig): Promise<ParsedRSSItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetchWithValidatedRedirects(config.url, controller.signal);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${config.url}`);
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_RSS_BYTES) {
      throw new Error(`RSS feed too large: ${config.url}`);
    }

    const feedText = await response.text();
    if (feedText.length > MAX_RSS_BYTES) {
      throw new Error(`RSS feed too large: ${config.url}`);
    }

    const feed = await parser.parseString(feedText);
    const items = feed.items.slice(0, config.maxItems ?? 20);

    return items.map((item) => {
      const rawContent = item['content:encoded'] || item.content || item.summary || '';
      const { content, plainText, imageUrls } = sanitizeRSSContent(rawContent);

      return {
        title: item.title || null,
        content,
        plainText,
        url: item.link || null,
        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
        author: item.creator || item['dc:creator'] || null,
        imageUrls,
      };
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('[fetchRSSFeed] Timeout for:', config.url);
      throw new Error(`RSS feed request timed out: ${config.url}`);
    }
    console.error('[fetchRSSFeed] Error:', error);
    throw new Error(`Failed to fetch RSS feed: ${config.url}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function sanitizeRSSContent(rawContent: string): {
  content: string;
  plainText: string;
  imageUrls: string[];
} {
  const content = sanitizeHtml(rawContent, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    transformTags: {
      script: 'remove',
      style: 'remove',
      iframe: 'remove',
      form: 'remove',
      input: 'remove',
      button: 'remove',
      object: 'remove',
      embed: 'remove',
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    exclusiveFilter: (frame) => {
      if (frame.tag === 'a') {
        const href = frame.attribs.href;
        if (href) {
          try {
            const url = new URL(href);
            if (!['http:', 'https:'].includes(url.protocol)) {
              return true;
            }
          } catch {
            return true;
          }
        }
      }
      return false;
    },
  });

  const plainText = sanitizeHtml(rawContent, {
    allowedTags: [],
    allowedAttributes: {},
  }).replaceAll(/\s+/g, ' ').trim();

  const imageUrls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1]?.startsWith('http')) {
      imageUrls.push(match[1]);
    }
  }

  return { content, plainText, imageUrls: [...new Set(imageUrls)] };
}

export function extractFirstImage(content: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = imgRegex.exec(content);
  return match?.[1] || null;
}

export function truncateContent(content: string, maxLength: number = 500): string {
  if (content.length <= maxLength) return content;

  const truncated = content.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}
