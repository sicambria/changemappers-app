'use client';

import Dexie, { type Table } from 'dexie';

export interface LocalCanvasRecord {
  id: string;
  title: string;
  description?: string | null;
  visibility: string;
  diagramXml?: string | null;
  updatedAt: string;
  cloudUpdatedAt?: string | null;
  dirty: boolean;
}

export interface LocalCanvasNodeRecord {
  id: string;
  canvasId: string;
  type: string;
  title: string;
  description?: string | null;
  positionX: number;
  positionY: number;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface LocalCanvasLinkRecord {
  id: string;
  canvasId: string;
  fromNodeId: string;
  toNodeId: string;
  linkType: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface LocalCanvasCommentRecord {
  id: string;
  nodeId: string;
  authorId: string;
  content: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface LocalIdentitySidecarRecord {
  id: 'current';
  algorithm: 'Ed25519';
  did: string;
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

class ChangemappersLocalDatabase extends Dexie {
  canvases!: Table<LocalCanvasRecord, string>;
  nodes!: Table<LocalCanvasNodeRecord, string>;
  links!: Table<LocalCanvasLinkRecord, string>;
  comments!: Table<LocalCanvasCommentRecord, string>;
  identitySidecars!: Table<LocalIdentitySidecarRecord, string>;

  constructor() {
    super('changemappers-local-first');
    this.version(1).stores({
      canvases: '&id, dirty, updatedAt',
      nodes: '&id, canvasId, updatedAt, deletedAt',
      links: '&id, canvasId, updatedAt, deletedAt',
      comments: '&id, nodeId, createdAt, deletedAt',
      identitySidecars: '&id, did',
    });
  }
}

export const localDb = new ChangemappersLocalDatabase();

export async function upsertLocalCanvas(record: LocalCanvasRecord): Promise<void> {
  await localDb.canvases.put(record);
}

export async function getLocalCanvas(id: string): Promise<LocalCanvasRecord | undefined> {
  return localDb.canvases.get(id);
}

export async function markLocalCanvasSynced(id: string, cloudUpdatedAt = new Date().toISOString()): Promise<void> {
  await localDb.canvases.update(id, { dirty: false, cloudUpdatedAt });
}
