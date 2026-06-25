import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { EmailOptions } from '../types';
import { BaseEmailProvider } from './base';

export class MailgunProvider extends BaseEmailProvider {
  private readonly client: ReturnType<Mailgun['client']>;
  private readonly domain: string;

  constructor() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey) {
      throw new Error('MAILGUN_API_KEY is not configured');
    }
    if (!domain) {
      throw new Error('MAILGUN_DOMAIN is not configured');
    }
    super();

    this.domain = domain;
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: 'api',
      key: apiKey,
    });
  }

  async send(options: EmailOptions): Promise<void> {
    const { to, subject, html, text, replyTo } = options;
    const recipients = this.formatRecipients(to);

    try {
      const result = await this.client.messages.create(this.domain, {
        from: this.getSenderEmail(),
        to: recipients,
        subject,
        html,
        text,
        'h:Reply-To': replyTo,
      });

      if (result.status != null && result.status >= 400) {
        throw new Error(`HTTP ${result.status}`);
      }
    } catch (error) {
      this.handleError('Mailgun', error);
    }
  }

  getName(): string {
    return 'mailgun';
  }
}
