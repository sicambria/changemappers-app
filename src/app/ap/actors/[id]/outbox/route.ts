import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { buildActivityPubNote, buildOrderedCollection } from '@/lib/federation/activitypub';
import { canExposeActivityPubPost, normalizeFediverseSettings } from '@/lib/federation/settings';

interface OutboxRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: OutboxRouteProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      profileVisibility: true,
      isSuspended: true,
      federationSettings: true,
      FeedPost: {
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          content: true,
          plainText: true,
          createdAt: true,
          updatedAt: true,
          visibility: true,
        },
        take: 20,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const settings = normalizeFediverseSettings(user.federationSettings);
  const orderedItems = user.FeedPost
    .filter((post) => canExposeActivityPubPost({
      profileVisibility: user.profileVisibility,
      isSuspended: user.isSuspended,
      settings,
      postVisibility: post.visibility,
    }))
    .map((post) => buildActivityPubNote({ post, actorUserId: user.id }));

  return new NextResponse(
    JSON.stringify(buildOrderedCollection(buildAbsoluteUrl(`/ap/actors/${user.id}/outbox`), orderedItems)),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/activity+json; charset=utf-8',
      },
    },
  );
}
