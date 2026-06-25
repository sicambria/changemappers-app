'use client';

// Client-side only. Uses the Web Crypto API (available in browsers and Node 18+).
// The server never sees plaintext for these fields — all encryption/decryption
// happens in the browser before/after server action calls.

export type CoachMeEncryptionModel = 'STRONG' | 'RECOVERABLE';

// Fields stored encrypted in the database.
export const ENCRYPTED_FIELDS = [
  'customFocusTag',
  'whyImportant',
  'sessionGoal',
  'sessionSuccessCriteria',
  'miracleSignsA',
  'miracleSignsB',
  'miracleSignsC',
  'miracleOptional',
  'scalingResources',
  'scalingRecentMoments',
  'scalingNextStep',
  'actionPlanV1',
  'actionPlanFinal',
  'actionOptional',
  'finalReflections',
] as const;

type _EncryptedField = (typeof ENCRYPTED_FIELDS)[number];

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

async function deriveKEK(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(saltBase64).buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );
}

async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: KEY_LENGTH }, true, [
    'encrypt',
    'decrypt',
  ]);
}

async function wrapDEK(dek: CryptoKey, kek: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv });
  const combined = new Uint8Array(12 + wrapped.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrapped), 12);
  return toBase64(combined.buffer);
}

async function unwrapDEK(wrappedBase64: string, kek: CryptoKey): Promise<CryptoKey> {
  const combined = fromBase64(wrappedBase64);
  const iv = combined.slice(0, 12);
  const wrapped = combined.slice(12);
  return crypto.subtle.unwrapKey(
    'raw',
    wrapped,
    kek,
    { name: 'AES-GCM', iv },
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );
}

// --- Public API ---

export interface EncryptionSetupResult {
  salt: string;
  encryptedDek: string | null; // null for STRONG model
  key: CryptoKey;
}

/** Called once during first CoachMe use (Phase0Consent). */
export async function setupEncryption(
  password: string,
  model: CoachMeEncryptionModel,
): Promise<EncryptionSetupResult> {
  const salt = generateSalt();
  const kek = await deriveKEK(password, salt);

  if (model === 'STRONG') {
    return { salt, encryptedDek: null, key: kek };
  }

  // RECOVERABLE: random DEK wrapped with KEK
  const dek = await generateDEK();
  const encryptedDek = await wrapDEK(dek, kek);
  return { salt, encryptedDek, key: dek };
}

/** Called every time the user opens a CoachMe session (unlock screen). */
export async function unlockEncryption(
  password: string,
  salt: string,
  encryptedDek: string | null,
  model: CoachMeEncryptionModel,
): Promise<CryptoKey> {
  const kek = await deriveKEK(password, salt);
  if (model === 'STRONG') return kek;
  if (!encryptedDek) throw new Error('Missing encrypted DEK for RECOVERABLE model');
  return unwrapDEK(encryptedDek, kek);
}

/** Re-wrap the DEK under a new password (RECOVERABLE model only, called on password change). */
export async function rewrapDEK(
  oldPassword: string,
  newPassword: string,
  salt: string,
  encryptedDek: string,
): Promise<{ newSalt: string; newEncryptedDek: string }> {
  const oldKek = await deriveKEK(oldPassword, salt);
  const dek = await unwrapDEK(encryptedDek, oldKek);
  const newSalt = generateSalt();
  const newKek = await deriveKEK(newPassword, newSalt);
  const newEncryptedDek = await wrapDEK(dek, newKek);
  return { newSalt, newEncryptedDek };
}

async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return toBase64(combined.buffer);
}

async function decryptString(ciphertextBase64: string, key: CryptoKey): Promise<string> {
  const combined = fromBase64(ciphertextBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/** Encrypt all ENCRYPTED_FIELDS present in data. Leaves other fields untouched. */
export async function encryptSessionFields(
  data: Record<string, unknown>,
  key: CryptoKey,
): Promise<Record<string, unknown>> {
  // SAFE: Generic client-side encryption utility. Shallow copy is safe as we only
  // overwrite whitelisted ENCRYPTED_FIELDS and return the result for local UI state.
  const result = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.length > 0) {
      result[field] = await encryptString(value, key);
    }
  }
  return result;
}

/** Decrypt all ENCRYPTED_FIELDS present in data. Leaves other fields untouched. */
export async function decryptSessionFields(
  data: Record<string, unknown>,
  key: CryptoKey,
): Promise<Record<string, unknown>> {
  // SAFE: Generic client-side decryption utility. Shallow copy is safe as we only
  // overwrite whitelisted ENCRYPTED_FIELDS and return the result for local UI state.
  const result = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        result[field] = await decryptString(value, key);
      } catch {
        // If decryption fails (wrong key, corrupt data), leave as-is rather than crash.
        result[field] = '';
      }
    }
  }
  return result;
}

/** Convenience: check if a string looks like it's already encrypted (base64 of 12-byte IV + ciphertext). */
export function isEncrypted(value: string): boolean {
  try {
    return fromBase64(value).length > 12;
  } catch {
    return false;
  }
}
