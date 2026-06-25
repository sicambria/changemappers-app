import type { EmailProvider, EmailProviderType } from './types';
import { BrevoProvider } from './providers/brevo';
import { LocalProvider } from './providers/local';
import { MailgunProvider } from './providers/mailgun';
import { ResendProvider } from './providers/resend';
import { SmtpProvider } from './providers/smtp';

const providerCache = new Map<EmailProviderType, EmailProvider>();

function parseProviderType(value: string): EmailProviderType {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'brevo' ||
    normalized === 'mailgun' ||
    normalized === 'resend' ||
    normalized === 'smtp' ||
    normalized === 'local'
  ) {
    return normalized;
  }

  throw new Error(`Unsupported email provider: ${value}`);
}

function getConfiguredProvider(): EmailProviderType {
  const providerEnv = process.env.EMAIL_PROVIDER;
  const nodeEnv = process.env.NODE_ENV;
  if (providerEnv) return parseProviderType(providerEnv);
  if (nodeEnv === 'production') return 'smtp';
  return 'local';
}

export function getEmailProvider(): EmailProvider {
  return getOrCreateProvider(getConfiguredProvider());
}

export function getEmailProviderCandidates(): EmailProviderType[] {
  const provider = getConfiguredProvider();
  const providers: EmailProviderType[] = [provider];

  if (shouldUseSmtpFallback(provider)) {
    providers.push('smtp');
  }

  return providers;
}

function shouldUseSmtpFallback(provider: EmailProviderType): boolean {
  return provider === 'brevo' && process.env.EMAIL_PROVIDER_FALLBACK === 'smtp';
}

export function getOrCreateProvider(type: EmailProviderType): EmailProvider {
  const cached = providerCache.get(type);
  if (cached) {
    return cached;
  }

  const provider = createProvider(type);
  providerCache.set(type, provider);
  return provider;
}

function createProvider(type: EmailProviderType): EmailProvider {
  switch (type) {
    case 'brevo':
      return new BrevoProvider();
    case 'mailgun':
      return new MailgunProvider();
    case 'resend':
      return new ResendProvider();
    case 'smtp':
      return new SmtpProvider();
    case 'local':
      return new LocalProvider();
    default:
      return new LocalProvider();
  }
}

export function resetEmailProvider(): void {
  providerCache.clear();
}

export type { EmailProvider, EmailOptions, EmailProviderType } from './types';
