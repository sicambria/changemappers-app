import type { MetadataRoute } from 'next';

const PUBLIC_SITEMAP_PATHS = [
  '/',
  '/about',
  '/calendar',
  '/causes',
  '/communities',
  '/connect-nature',
  '/contribute',
  '/feed',
  '/forgot-password',
  '/growth',
  '/legal/privacy',
  '/legal/terms',
  '/login',
  '/map',
  '/register',
  '/signals',
  '/verify-email',
  '/volunteer',
];

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://app.changemappers.org').replace(/\/$/, '');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
