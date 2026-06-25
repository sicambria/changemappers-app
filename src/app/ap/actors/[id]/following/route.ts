import { NextResponse } from 'next/server';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { buildOrderedCollection } from '@/lib/federation/activitypub';

interface FollowingRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: FollowingRouteProps) {
  const { id } = await params;

  return new NextResponse(
    JSON.stringify(buildOrderedCollection(buildAbsoluteUrl(`/ap/actors/${id}/following`), [])),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/activity+json; charset=utf-8',
      },
    },
  );
}
