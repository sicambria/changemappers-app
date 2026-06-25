'use client';

import { localDb, type LocalIdentitySidecarRecord } from '@/lib/local-db';
import { generateP2PIdentitySidecar, type P2PIdentitySidecar } from '@/lib/p2p/identity';

function toSidecar(record: LocalIdentitySidecarRecord): P2PIdentitySidecar {
  return {
    algorithm: record.algorithm,
    did: record.did,
    publicKey: record.publicKey,
    privateKey: record.privateKey,
    createdAt: record.createdAt,
  };
}

export async function getLocalIdentitySidecar(): Promise<P2PIdentitySidecar | null> {
  const record = await localDb.identitySidecars.get('current');
  return record ? toSidecar(record) : null;
}

export async function ensureLocalIdentitySidecar(): Promise<P2PIdentitySidecar> {
  const existing = await getLocalIdentitySidecar();
  if (existing) return existing;

  const identity = generateP2PIdentitySidecar();
  await localDb.identitySidecars.put({ id: 'current', ...identity });
  return identity;
}
