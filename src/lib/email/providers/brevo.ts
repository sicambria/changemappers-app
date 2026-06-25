import { BrevoClient } from '@getbrevo/brevo';
import type { EmailOptions } from '../types';
import { BaseEmailProvider } from './base';

export class BrevoProvider extends BaseEmailProvider {
  private readonly client: BrevoClient;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }
    super();
    
    this.client = new BrevoClient({ apiKey });
  }

  async send(options: EmailOptions): Promise<void> {
    const { to, subject, html, text, replyTo } = options;
    const recipients = Array.isArray(to) ? to : [to];

    const senderEmail = this.getSenderEmail();

    try {
      const response = await this.client.transactionalEmails.sendTransacEmail({
        sender: { email: senderEmail },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
        textContent: text,
        replyTo: replyTo ? { email: replyTo } : undefined,
      });

      if (!response.messageId && !response.messageIds) {
        throw new Error('No message ID returned');
      }
    } catch (error) {
      this.handleBrevoError(error);
    }
  }

  private handleBrevoError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Brevo email failed: ${message}`);
  }

  getName(): string {
    return 'brevo';
  }
}
