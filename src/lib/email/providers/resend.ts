import { Resend } from 'resend';
import type { EmailOptions } from '../types';
import { BaseEmailProvider } from './base';

export class ResendProvider extends BaseEmailProvider {
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    super();
    this.resend = new Resend(apiKey);
  }

  async send(options: EmailOptions): Promise<void> {
    const { to, subject, html, text, replyTo } = options;

    try {
      const result = await this.resend.emails.send({
        from: this.getSenderEmail(),
        to,
        subject,
        html,
        text,
        replyTo,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      this.handleError('Resend', error);
    }
  }

  getName(): string {
    return 'resend';
  }
}
