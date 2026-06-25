export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
  getName(): string;
}

export type EmailProviderType = 'local' | 'resend' | 'brevo' | 'mailgun' | 'smtp';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
