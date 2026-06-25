import { ed25519 } from '@noble/curves/ed25519.js';

const DID_KEY_ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const TEXT_ENCODER = new TextEncoder();

export interface P2PIdentitySidecar {
  algorithm: 'Ed25519';
  did: string;
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

export interface SignedJsonBundle<TPayload> {
  payload: TPayload;
  signature: {
    algorithm: 'Ed25519';
    did: string;
    publicKey: string;
    signature: string;
    signedAt: string;
  };
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      const value = digits[index] * 256 + carry;
      digits[index] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let output = '';
  for (const byte of bytes) {
    if (byte !== 0) break;
    output += BASE58_ALPHABET[0];
  }

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    output += BASE58_ALPHABET[digits[index]];
  }

  return output;
}

export function publicKeyToDidKey(publicKey: Uint8Array): string {
  const multicodecKey = new Uint8Array(DID_KEY_ED25519_MULTICODEC_PREFIX.length + publicKey.length);
  multicodecKey.set(DID_KEY_ED25519_MULTICODEC_PREFIX);
  multicodecKey.set(publicKey, DID_KEY_ED25519_MULTICODEC_PREFIX.length);
  return `did:key:z${bytesToBase58(multicodecKey)}`;
}

export function generateP2PIdentitySidecar(): P2PIdentitySidecar {
  const keypair = ed25519.keygen();
  return {
    algorithm: 'Ed25519',
    did: publicKeyToDidKey(keypair.publicKey),
    publicKey: bytesToBase64Url(keypair.publicKey),
    privateKey: bytesToBase64Url(keypair.secretKey),
    createdAt: new Date().toISOString(),
  };
}

export function stableStringify(value: unknown): string {
  if (value === undefined) {
    return 'null';
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  // Canonical JSON for ed25519 signing/verification: object keys MUST be ordered by
  // Unicode code point so the serialization is deterministic and byte-identical across
  // runtimes (Node vs browser ICU). A locale-aware comparator (localeCompare) would make
  // the signature input environment-dependent and break cross-peer verification — so the
  // default code-point .sort() is required here, not a defect.
  return `{${Object.keys(record)
    .sort() // NOSONAR — see comment above: locale-independent code-point order is mandatory for signing
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

export function signJsonPayload<TPayload>(
  payload: TPayload,
  identity: P2PIdentitySidecar,
): SignedJsonBundle<TPayload> {
  const privateKey = base64UrlToBytes(identity.privateKey);
  const signature = ed25519.sign(TEXT_ENCODER.encode(stableStringify(payload)), privateKey);

  return {
    payload,
    signature: {
      algorithm: 'Ed25519',
      did: identity.did,
      publicKey: identity.publicKey,
      signature: bytesToBase64Url(signature),
      signedAt: new Date().toISOString(),
    },
  };
}

export function verifySignedJsonBundle(bundle: SignedJsonBundle<unknown>): boolean {
  return ed25519.verify(
    base64UrlToBytes(bundle.signature.signature),
    TEXT_ENCODER.encode(stableStringify(bundle.payload)),
    base64UrlToBytes(bundle.signature.publicKey),
  );
}
