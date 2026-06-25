import type { EmailProvider, EmailOptions } from '../types';

export abstract class BaseEmailProvider implements EmailProvider {
  abstract send(options: EmailOptions): Promise<void>;
  abstract getName(): string;

  protected getSenderEmail(): string {
    return process.env.EMAIL_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? 'noreply@changemappers.com';
  }

  protected formatRecipients(to: string | string[]): string {
    return Array.isArray(to) ? to.join(', ') : to;
  }

  protected handleError(providerName: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${providerName} email failed: ${message}`);
  }
}
