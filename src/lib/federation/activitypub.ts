import { buildAbsoluteUrl } from '@/lib/site-url';
import { escapeHtml, escapeHtmlAttribute } from '@/lib/html';
import { getActivityPubUsername } from '@/lib/federation/settings';

type SocialLinks = Record<string, string>;

interface ActorInput {
  user: {
    id: string;
    name: string;
    displayName: string | null;
    bio: string | null;
    website: string | null;
    socialLinks: SocialLinks | null;
    city: string | null;
    country: string | null;
    profilePhoto: string | null;
    coverImage: string | null;
    createdAt: Date;
  };
  settings: {
    discoverable: boolean;
    showWebsiteInActor: boolean;
    showSocialLinksInActor: boolean;
    showLocationInActor: boolean;
  };
}

interface PostInput {
  post: {
    id: string;
    slug: string;
    content: string | null;
    plainText: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  actorUserId: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function relMeLink(value: string): string | null {
  if (!isHttpUrl(value)) {
    return null;
  }

  const href = encodeURI(value);
  return `<a href="${escapeHtmlAttribute(href)}" rel="me noopener noreferrer">${escapeHtml(value)}</a>`;
}

function propertyValue(name: string, value: string) {
  return {
    type: 'PropertyValue',
    name,
    value,
  };
}

function buildSocialLinkAttachments(
  socialLinks: SocialLinks,
): Array<{ type: string; name: string; value: string }> {
  const result: Array<{ type: string; name: string; value: string }> = [];
  for (const [platform, value] of Object.entries(socialLinks)) {
    if (!value) continue;
    const socialLink = relMeLink(value);
    if (socialLink) result.push(propertyValue(escapeHtml(platform), socialLink));
  }
  return result;
}

function buildActorAttachments(
  user: ActorInput['user'],
  settings: ActorInput['settings'],
): Array<{ type: string; name: string; value: string }> {
  const attachment: Array<{ type: string; name: string; value: string }> = [];

  if (settings.showWebsiteInActor && user.website) {
    const websiteLink = relMeLink(user.website);
    if (websiteLink) attachment.push(propertyValue('Website', websiteLink));
  }

  if (settings.showSocialLinksInActor && user.socialLinks) {
    attachment.push(...buildSocialLinkAttachments(user.socialLinks));
  }

  if (settings.showLocationInActor) {
    const location = [user.city, user.country].filter(Boolean).join(', ');
    if (location) attachment.push(propertyValue('Location', escapeHtml(location)));
  }

  return attachment;
}

export function buildActivityPubActor({ user, settings }: ActorInput) {
  const actorId = buildAbsoluteUrl(`/ap/actors/${user.id}`);
  const profileUrl = buildAbsoluteUrl(`/profile/${user.id}`);
  const username = getActivityPubUsername(user.id);
  const attachment = buildActorAttachments(user, settings);

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
      {
        discoverable: 'toot:discoverable',
        toot: 'http://joinmastodon.org/ns#',
      },
    ],
    id: actorId,
    type: 'Person',
    preferredUsername: username,
    name: user.displayName || user.name,
    summary: user.bio || '',
    url: profileUrl,
    inbox: `${actorId}/inbox`,
    outbox: `${actorId}/outbox`,
    followers: `${actorId}/followers`,
    following: `${actorId}/following`,
    discoverable: settings.discoverable,
    published: user.createdAt.toISOString(),
    attachment: attachment.length > 0 ? attachment : undefined,
    icon: user.profilePhoto
      ? {
          type: 'Image',
          mediaType: 'image/jpeg',
          url: user.profilePhoto,
        }
      : undefined,
    image: user.coverImage
      ? {
          type: 'Image',
          mediaType: 'image/jpeg',
          url: user.coverImage,
        }
      : undefined,
  };
}

export function buildActivityPubNote({ post, actorUserId }: PostInput) {
  const actorId = buildAbsoluteUrl(`/ap/actors/${actorUserId}`);
  const noteId = buildAbsoluteUrl(`/ap/objects/post/${post.slug}`);
  const canonicalUrl = buildAbsoluteUrl(`/feed/${post.slug}`);

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: noteId,
    type: 'Note',
    attributedTo: actorId,
    url: canonicalUrl,
    published: post.createdAt.toISOString(),
    updated: post.updatedAt.toISOString(),
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [`${actorId}/followers`],
    content: post.content || '',
    contentMap: {
      en: post.content || '',
    },
    summary: post.plainText || '',
  };
}

export function buildOrderedCollection(
  id: string,
  orderedItems: unknown[],
) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id,
    type: 'OrderedCollection',
    totalItems: orderedItems.length,
    orderedItems,
  };
}
