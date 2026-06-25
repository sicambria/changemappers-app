import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildActivityPubNote } from '@/lib/federation/activitypub';
import { canExposeActivityPubPost, normalizeFediverseSettings } from '@/lib/federation/settings';

interface PostObjectRouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: PostObjectRouteProps) {
  const { slug } = await params;

  const post = await prisma.feedPost.findUnique({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      content: true,
      plainText: true,
      createdAt: true,
      updatedAt: true,
      visibility: true,
      author: {
        select: {
          id: true,
          profileVisibility: true,
          isSuspended: true,
          federationSettings: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const settings = normalizeFediverseSettings(post.author.federationSettings);
  if (!canExposeActivityPubPost({
    profileVisibility: post.author.profileVisibility,
    isSuspended: post.author.isSuspended,
    settings,
    postVisibility: post.visibility,
  })) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(
    JSON.stringify(buildActivityPubNote({ post, actorUserId: post.author.id })),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/activity+json; charset=utf-8',
      },
    },
  );
}
