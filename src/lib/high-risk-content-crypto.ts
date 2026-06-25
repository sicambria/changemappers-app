import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const HIGH_RISK_CONTENT_PREFIX = 'cmenc:v1';
const HIGH_RISK_CONTENT_SECRET_MIN_LENGTH = 32;
const DEFAULT_HIGH_RISK_CONTENT_CONTEXT = 'changemappers:high-risk-content:v1';

export class HighRiskContentCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HighRiskContentCryptoError';
  }
}

function getHighRiskContentSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.HIGH_RISK_CONTENT_ENCRYPTION_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export function isHighRiskContentEncryptionConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return getHighRiskContentSecret(env) !== null;
}

export function validateHighRiskContentEncryptionConfig(env: NodeJS.ProcessEnv = process.env): string | null {
  const secret = getHighRiskContentSecret(env);
  if (!secret) {
    return 'HIGH_RISK_CONTENT_ENCRYPTION_KEY must be set for production direct-message encryption';
  }
  if (secret.length < HIGH_RISK_CONTENT_SECRET_MIN_LENGTH) {
    return `HIGH_RISK_CONTENT_ENCRYPTION_KEY must be at least ${HIGH_RISK_CONTENT_SECRET_MIN_LENGTH} characters`;
  }
  return null;
}

export function isEncryptedHighRiskContent(value: string): boolean {
  return value.startsWith(`${HIGH_RISK_CONTENT_PREFIX}:`);
}

function deriveContentKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

function toBase64Url(value: Buffer): string {
  return value.toString('base64url');
}

function fromBase64Url(value: string, label: string): Buffer {
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new HighRiskContentCryptoError(`Invalid encrypted content ${label}`);
  }
}

function getAad(context: string): Buffer {
  return Buffer.from(context || DEFAULT_HIGH_RISK_CONTENT_CONTEXT, 'utf8');
}

export function encryptHighRiskContent(
  plaintext: string,
  context = DEFAULT_HIGH_RISK_CONTENT_CONTEXT,
): string {
  if (plaintext.length === 0 || isEncryptedHighRiskContent(plaintext)) {
    return plaintext;
  }

  const configError = validateHighRiskContentEncryptionConfig();
  if (configError) {
    if (process.env.NODE_ENV === 'production') {
      throw new HighRiskContentCryptoError(configError);
    }
    return plaintext;
  }

  const secret = getHighRiskContentSecret();
  if (!secret) {
    return plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveContentKey(secret), iv);
  cipher.setAAD(getAad(context));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [HIGH_RISK_CONTENT_PREFIX, toBase64Url(iv), toBase64Url(tag), toBase64Url(ciphertext)].join(':');
}

export function decryptHighRiskContent(
  value: string,
  context = DEFAULT_HIGH_RISK_CONTENT_CONTEXT,
): string {
  if (!isEncryptedHighRiskContent(value)) {
    return value;
  }

  const configError = validateHighRiskContentEncryptionConfig();
  if (configError) {
    throw new HighRiskContentCryptoError(configError);
  }

  const secret = getHighRiskContentSecret();
  if (!secret) {
    throw new HighRiskContentCryptoError('HIGH_RISK_CONTENT_ENCRYPTION_KEY is not configured');
  }

  const parts = value.split(':');
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== HIGH_RISK_CONTENT_PREFIX) {
    throw new HighRiskContentCryptoError('Invalid encrypted content envelope');
  }

  const iv = fromBase64Url(parts[2], 'iv');
  const tag = fromBase64Url(parts[3], 'tag');
  const ciphertext = fromBase64Url(parts[4], 'ciphertext');

  try {
    const decipher = createDecipheriv('aes-256-gcm', deriveContentKey(secret), iv);
    decipher.setAAD(getAad(context));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new HighRiskContentCryptoError('Encrypted content authentication failed');
  }
}
