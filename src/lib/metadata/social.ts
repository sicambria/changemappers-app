import type { Metadata } from 'next';
import { buildAbsoluteUrl, getSiteOrigin } from '@/lib/site-url';

interface SocialMetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}

export function createSocialMetadata(input: SocialMetadataInput): Metadata {
  const url = input.path ? buildAbsoluteUrl(input.path) : undefined;
  const image = input.image ? buildAbsoluteUrl(input.image) : undefined;

  return {
    metadataBase: new URL(getSiteOrigin()),
    title: input.title,
    description: input.description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: input.type || 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: input.title,
      description: input.description,
      images: image ? [image] : undefined,
    },
  };
}
