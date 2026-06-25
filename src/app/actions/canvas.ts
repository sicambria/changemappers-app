'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma, { CommunityRole } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createCanvasSchema,
  createNodeSchema,
  createLinkSchema,
  proposePatternSchema,
  addInterventionReflectionSchema,
  addNodeCommentSchema,
  rootCauseDiagnosticSchema,
  updateNodePositionSchema,
  type CreateCanvasInput,
  type CreateNodeInput,
  type CreateLinkInput,
  type ProposePatternInput,
  type AddInterventionReflectionInput,
  type AddNodeCommentInput,
  type RootCauseDiagnosticInput,
  type UpdateNodePositionInput,
} from '@/lib/validations/canvas';
import {
  canvasTag,
  CACHE_TAG_PATTERN_LIBRARY,
} from '@/lib/cache-tags';
import type { ApiResponse } from '@/types/modalities';
import { runAction } from '@/lib/server-action-wrapper';

const CANVAS_WRITE_ROLES: CommunityRole[] = [
  CommunityRole.OWNER,
  CommunityRole.ADMIN,
  CommunityRole.MODERATOR,
];

async function hasCanvasWriteAccess(canvasId: string, userId: string): Promise<boolean> {
  const canvas = await prisma.systemsCanvas.findUnique({
    where: { id: canvasId },
    select: { status: true, createdById: true, communityId: true },
  });

  if (!canvas || canvas.status === 'ARCHIVED') {
    return false;
  }

  if (canvas.createdById === userId) {
    return true;
  }

  if (!canvas.communityId) {
    return false;
  }

  const membership = await prisma.communityMember.findFirst({
    where: {
      communityId: canvas.communityId,
      userId,
      status: 'ACTIVE',
      role: { in: CANVAS_WRITE_ROLES },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

// ─────────────────────────────────────────
// CANVAS CRUD
// ─────────────────────────────────────────

export async function createCanvasAction(
  input: CreateCanvasInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createCanvasAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createCanvasSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // If visibility is COMMUNITY, verify user is member of the community
  if (parsed.data.visibility === 'COMMUNITY' && parsed.data.communityId) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: parsed.data.communityId,
          userId: auth.data.id,
        },
      },
      select: { id: true },
    });
    if (!membership) {
      return { success: false, error: 'You must be a community member to create a community canvas' };
    }
  }

  const canvas = await prisma.systemsCanvas.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      communityId: parsed.data.communityId ?? null,
      visibility: parsed.data.visibility,
      createdById: auth.data.id,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  revalidateTag(canvasTag(canvas.id), 'default');
  return { success: true, data: canvas };
  });
}

export async function editCanvasAction(
id: string,
input: Partial<CreateCanvasInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editCanvasAction', async () => {
const auth = await getCurrentUser();
if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const canvas = await prisma.systemsCanvas.findUnique({
where: { id },
select: { createdById: true },
});
if (!canvas || canvas.createdById !== auth.data.id) return { success: false, error: 'Not found' };

const updateData = createCanvasSchema.partial().parse(input);

await prisma.systemsCanvas.update({ where: { id }, data: updateData });

revalidateTag(canvasTag(id), 'default');
return { success: true, data: { id } };
  });
}

export async function archiveCanvasAction(id: string): Promise<ApiResponse<void>> {
  return runAction('archiveCanvasAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const canvas = await prisma.systemsCanvas.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!canvas || canvas.createdById !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.systemsCanvas.update({ where: { id }, data: { status: 'ARCHIVED' } });

  revalidateTag(canvasTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// DIAGRAM XML (draw.io)
// ─────────────────────────────────────────

export async function saveCanvasDiagramAction(
  id: string,
  xml: string,
): Promise<ApiResponse<void>> {
  return runAction('saveCanvasDiagramAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  if (!xml || typeof xml !== 'string' || xml.length > 5_000_000) {
    return { success: false, error: 'Invalid diagram data' };
  }

  const canvas = await prisma.systemsCanvas.findUnique({
    where: { id, status: 'ACTIVE' },
    select: { createdById: true, visibility: true, communityId: true },
  });

  if (!canvas) return { success: false, error: 'Canvas not found' };

  // Only the owner can save
  if (canvas.createdById !== auth.data.id) {
    return { success: false, error: 'Only the owner can save this diagram' };
  }

  await prisma.systemsCanvas.update({
    where: { id },
    data: { diagramXml: xml },
  });

  revalidateTag(canvasTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// NODE CRUD (soft delete)
// ─────────────────────────────────────────

export async function createNodeAction(
  input: CreateNodeInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createNodeAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createNodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  if (!(await hasCanvasWriteAccess(parsed.data.canvasId, auth.data.id))) {
    return { success: false, error: 'Canvas not found or archived' };
  }

  // Node create + audit log must be atomic (AUDIT-20260612-010).
  const node = await prisma.$transaction(async (tx) => {
    const created = await tx.systemsCanvasNode.create({
      data: {
        canvasId: parsed.data.canvasId,
        type: parsed.data.type as never,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        positionX: parsed.data.positionX ?? 0,
        positionY: parsed.data.positionY ?? 0,
        createdById: auth.data.id,
      },
      select: { id: true },
    });

    // Audit log reuse
    await tx.auditLog.create({
      data: {
        entityType: 'CanvasNode',
        entityId: created.id,
        action: 'CREATE',
        userId: auth.data.id,
        metadata: { type: parsed.data.type, title: parsed.data.title },
      },
    });

    return created;
  });

  revalidateTag(canvasTag(parsed.data.canvasId), 'default');
  return { success: true, data: node };
  });
}

export async function updateNodePositionAction(
  id: string,
  input: UpdateNodePositionInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('updateNodePositionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = updateNodePositionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const node = await prisma.systemsCanvasNode.findUnique({
    where: { id },
    select: { canvasId: true, deletedAt: true },
  });
  if (!node || node.deletedAt) return { success: false, error: 'Not found' };
  if (!(await hasCanvasWriteAccess(node.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.systemsCanvasNode.update({
    where: { id },
    data: {
      positionX: parsed.data.positionX,
      positionY: parsed.data.positionY,
    },
  });

  revalidateTag(canvasTag(node.canvasId), 'default');
  return { success: true, data: { id } };
  });
}

export async function editNodeAction(
  id: string,
  input: { title?: string; description?: string },
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editNodeAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const node = await prisma.systemsCanvasNode.findUnique({
    where: { id },
    select: { canvasId: true, deletedAt: true },
  });
  if (!node || node.deletedAt) return { success: false, error: 'Not found' };
  if (!(await hasCanvasWriteAccess(node.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }

  // Node update + audit log must be atomic (AUDIT-20260613-030).
  await prisma.$transaction(async (tx) => {
    await tx.systemsCanvasNode.update({ where: { id }, data: input });

    // Audit log
    await tx.auditLog.create({
      data: {
        entityType: 'CanvasNode',
        entityId: id,
        action: 'UPDATE',
        userId: auth.data.id,
        metadata: input,
      },
    });
  });

  revalidateTag(canvasTag(node.canvasId), 'default');
  return { success: true, data: { id } };
  });
}

export async function softDeleteNodeAction(id: string): Promise<ApiResponse<void>> {
  return runAction('softDeleteNodeAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const node = await prisma.systemsCanvasNode.findUnique({
    where: { id },
    select: { canvasId: true, deletedAt: true },
  });
  if (!node || node.deletedAt) return { success: false, error: 'Not found' };
  if (!(await hasCanvasWriteAccess(node.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }

  // Soft-delete update + audit log must be atomic (AUDIT-20260613-030).
  await prisma.$transaction(async (tx) => {
    await tx.systemsCanvasNode.update({ where: { id }, data: { deletedAt: new Date() } });

    // Audit log
    await tx.auditLog.create({
      data: {
        entityType: 'CanvasNode',
        entityId: id,
        action: 'DELETE',
        userId: auth.data.id,
        metadata: {},
      },
    });
  });

  revalidateTag(canvasTag(node.canvasId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// LINK CRUD (soft delete)
// ─────────────────────────────────────────

export async function createLinkAction(
  input: CreateLinkInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createLinkAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // Verify both nodes exist and are on the same canvas
  const [fromNode, toNode] = await Promise.all([
    prisma.systemsCanvasNode.findUnique({
      where: { id: parsed.data.fromNodeId },
      select: { canvasId: true, deletedAt: true },
    }),
    prisma.systemsCanvasNode.findUnique({
      where: { id: parsed.data.toNodeId },
      select: { canvasId: true, deletedAt: true },
    }),
  ]);

  if (!fromNode || fromNode.deletedAt) return { success: false, error: 'Source node not found' };
  if (!toNode || toNode.deletedAt) return { success: false, error: 'Target node not found' };
  if (fromNode.canvasId !== parsed.data.canvasId || toNode.canvasId !== parsed.data.canvasId) {
    return { success: false, error: 'Nodes must be on the same canvas' };
  }
  if (!(await hasCanvasWriteAccess(parsed.data.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }

  const link = await prisma.systemsCanvasLink.create({
    data: {
      canvasId: parsed.data.canvasId,
      fromNodeId: parsed.data.fromNodeId,
      toNodeId: parsed.data.toNodeId,
      linkType: parsed.data.linkType as never,
    },
    select: { id: true },
  });

  revalidateTag(canvasTag(parsed.data.canvasId), 'default');
  return { success: true, data: link };
  });
}

export async function softDeleteLinkAction(id: string): Promise<ApiResponse<void>> {
  return runAction('softDeleteLinkAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const link = await prisma.systemsCanvasLink.findUnique({
    where: { id },
    select: { canvasId: true, deletedAt: true },
  });
  if (!link || link.deletedAt) return { success: false, error: 'Not found' };
  if (!(await hasCanvasWriteAccess(link.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.systemsCanvasLink.update({ where: { id }, data: { deletedAt: new Date() } });

  revalidateTag(canvasTag(link.canvasId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// PATTERN LIBRARY
// ─────────────────────────────────────────

export async function proposePatternAction(
  input: ProposePatternInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('proposePatternAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = proposePatternSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const pattern = await prisma.patternLibraryEntry.create({
    data: {
      ...parsed.data,
      status: 'PROPOSED',
      proposedById: auth.data.id,
    },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_PATTERN_LIBRARY, 'default');
  return { success: true, data: pattern };
  });
}

export async function editPatternAction(
  id: string,
  input: Partial<ProposePatternInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editPatternAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const pattern = await prisma.patternLibraryEntry.findUnique({
    where: { id },
    select: { proposedById: true },
  });
  if (!pattern || pattern.proposedById !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.patternLibraryEntry.update({ where: { id }, data: input });

  revalidateTag(CACHE_TAG_PATTERN_LIBRARY, 'default');
  return { success: true, data: { id } };
  });
}

export async function validatePatternAction(id: string): Promise<ApiResponse<void>> {
  return runAction('validatePatternAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  if (!auth.data.isAdmin) return { success: false, error: 'Admin only' };

  await prisma.patternLibraryEntry.update({ where: { id }, data: { status: 'VALIDATED' } });

  revalidateTag(CACHE_TAG_PATTERN_LIBRARY, 'default');
  return { success: true, data: undefined };
  });
}

export async function retirePatternAction(id: string): Promise<ApiResponse<void>> {
  return runAction('retirePatternAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  if (!auth.data.isAdmin) return { success: false, error: 'Admin only' };

  await prisma.patternLibraryEntry.update({ where: { id }, data: { status: 'RETIRED' } });

  revalidateTag(CACHE_TAG_PATTERN_LIBRARY, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// INTERVENTION RECORDS
// ─────────────────────────────────────────

export async function addInterventionReflectionAction(
  input: AddInterventionReflectionInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('addInterventionReflectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = addInterventionReflectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const node = await prisma.systemsCanvasNode.findUnique({
    where: { id: parsed.data.nodeId },
    select: { canvasId: true, deletedAt: true, type: true },
  });
  if (!node || node.deletedAt) return { success: false, error: 'Node not found' };
  if (!(await hasCanvasWriteAccess(node.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }
  if (node.type !== 'INTERVENTION') {
    return { success: false, error: 'Only INTERVENTION nodes can have intervention records' };
  }

  const record = await prisma.interventionRecord.create({
    data: {
      nodeId: parsed.data.nodeId,
      authorId: auth.data.id,
      outcome: parsed.data.outcome as never,
      reflection: parsed.data.reflection,
    },
    select: { id: true },
  });

  revalidateTag(canvasTag(node.canvasId), 'default');
  return { success: true, data: record };
  });
}

// ─────────────────────────────────────────
// NODE COMMENTS
// ─────────────────────────────────────────

export async function addNodeCommentAction(
  input: AddNodeCommentInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('addNodeCommentAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = addNodeCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const node = await prisma.systemsCanvasNode.findUnique({
    where: { id: parsed.data.nodeId },
    select: { canvasId: true, deletedAt: true },
  });
  if (!node || node.deletedAt) return { success: false, error: 'Node not found' };
  if (!(await hasCanvasWriteAccess(node.canvasId, auth.data.id))) {
    return { success: false, error: 'Unauthorized' };
  }

  const comment = await prisma.canvasNodeComment.create({
    data: {
      nodeId: parsed.data.nodeId,
      authorId: auth.data.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    },
    select: { id: true },
  });

  revalidateTag(canvasTag(node.canvasId), 'default');
  return { success: true, data: comment };
  });
}

export async function deleteNodeCommentAction(id: string): Promise<ApiResponse<void>> {
  return runAction('deleteNodeCommentAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const comment = await prisma.canvasNodeComment.findUnique({
		where: { id },
		select: {
			id: true,
			authorId: true,
			deletedAt: true,
			node: { select: { canvasId: true } }
		},
	});
  if (!comment || comment.deletedAt) return { success: false, error: 'Not found' };

  const isAuthor = comment.authorId === auth.data.id;
  const isAdmin = auth.data.isAdmin === true;
  if (!isAuthor && !isAdmin) return { success: false, error: 'Unauthorized' };

  await prisma.canvasNodeComment.update({ where: { id }, data: { deletedAt: new Date() } });

  revalidateTag(canvasTag(comment.node.canvasId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// ROOT CAUSE DIAGNOSTIC
// ─────────────────────────────────────────

export async function submitRootCauseDiagnosticAction(
  input: RootCauseDiagnosticInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('submitRootCauseDiagnosticAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = rootCauseDiagnosticSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  if (!(await hasCanvasWriteAccess(parsed.data.canvasId, auth.data.id))) {
    return { success: false, error: 'Canvas not found or archived' };
  }

  const diagnostic = await prisma.rootCauseDiagnostic.create({
    data: {
      canvasId: parsed.data.canvasId,
      authorId: auth.data.id,
      decisionClarity: parsed.data.decisionClarity,
      preDecisionDisagreement: parsed.data.preDecisionDisagreement,
      coordinationAwareness: parsed.data.coordinationAwareness,
      ...(parsed.data.rawResponses !== undefined && { rawResponses: parsed.data.rawResponses as object }),
    },
    select: { id: true },
  });

  revalidateTag(canvasTag(parsed.data.canvasId), 'default');
  return { success: true, data: diagnostic };
  });
}
