import nodemailer from 'nodemailer';
import type { EmailOptions } from '../types';
import { BaseEmailProvider } from './base';

export class SmtpProvider extends BaseEmailProvider {
  private readonly transporter: nodemailer.Transporter;

  private isLocalSmtpHost(host: string): boolean {
    return host === 'localhost'
      || host === '127.0.0.1'
      || host === '::1'
      || host === 'host.docker.internal'
      || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  }

  constructor() {
    super();
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      tls: {
        // Allow self-signed certificates for same-host/container-bridge SMTP.
        rejectUnauthorized: !this.isLocalSmtpHost(host)
      }
    });
  }

  async send(options: EmailOptions): Promise<void> {
    const { to, subject, html, text, replyTo } = options;
    const sender = this.getSenderEmail();

    try {
      const info = await this.transporter.sendMail({
        from: sender,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        replyTo,
      });

      if (process.env.EMAIL_DEBUG === 'true') {
        const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : 0;
        const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0;
        const messageId = typeof info.messageId === 'string' ? info.messageId : 'unknown';
        console.info(
          `[email:smtp] accepted=${acceptedCount} rejected=${rejectedCount} messageId=${messageId}`
        );
      }
    } catch (error) {
      this.handleError('SMTP', error);
    }
  }

  getName(): string {
    return 'smtp';
  }
}
