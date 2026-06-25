import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildActivityPubActor } from '@/lib/federation/activitypub';
import { canExposeActivityPubProfile, normalizeFediverseSettings } from '@/lib/federation/settings';

function activityPubResponse(body: unknown) {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/activity+json; charset=utf-8',
    },
  });
}

interface ActorRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: ActorRouteProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      displayName: true,
      bio: true,
      website: true,
      socialLinks: true,
      city: true,
      country: true,
      profilePhoto: true,
      coverImage: true,
      createdAt: true,
      profileVisibility: true,
      isSuspended: true,
      federationSettings: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const settings = normalizeFediverseSettings(user.federationSettings);
  if (!canExposeActivityPubProfile({ profileVisibility: user.profileVisibility, isSuspended: user.isSuspended, settings })) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return activityPubResponse(buildActivityPubActor({
    user: {
      ...user,
      socialLinks: (user.socialLinks as Record<string, string> | null) ?? null,
    },
    settings: settings.activityPub,
  }));
}
