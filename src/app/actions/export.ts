'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';

export interface ExportBundlePayload {
  schema: 'org.changemappers.signed-export.v1';
  exportedAt: string;
  user: {
    id: string;
    didPublicKey: string | null;
    email: string;
    name: string;
    displayName: string | null;
    bio: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    profileVisibility: string;
    createdAt: string;
    updatedAt: string;
  };
  publicPosts: Array<{
    id: string;
    slug: string;
    content: string | null;
    plainText: string | null;
    visibility: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export async function createSignedExportBundlePayloadAction(): Promise<
  | { success: true; data: ExportBundlePayload }
  | { success: false; error: string }
> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.id },
    select: {
      id: true,
      didPublicKey: true,
      email: true,
      name: true,
      displayName: true,
      bio: true,
      website: true,
      city: true,
      country: true,
      profileVisibility: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const publicPosts = await prisma.feedPost.findMany({
    where: {
      authorId: user.id,
      visibility: 'PUBLIC',
      deletedAt: null,
      status: 'APPROVED',
    },
    select: {
      id: true,
      slug: true,
      content: true,
      plainText: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return {
    success: true,
    data: {
      schema: 'org.changemappers.signed-export.v1',
      exportedAt: new Date().toISOString(),
      user: {
        ...user,
        profileVisibility: user.profileVisibility,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      publicPosts: publicPosts.map((post) => ({
        ...post,
        visibility: post.visibility,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
    },
  };
}
