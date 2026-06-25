import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { EmailOptions } from '../types';
import { BaseEmailProvider } from './base';
import { logger } from '@/lib/logger';

// Redact sensitive token/code query params from URLs so they don't appear in terminal output.
const SENSITIVE_PARAM_RE = /([?&](token|code|secret|key|reset|verify)=)[^&\s"'<>]+/gi;
function redactTokens(s: string): string {
  return s.replaceAll(SENSITIVE_PARAM_RE, '$1[REDACTED]');
}

function shouldCaptureE2eEmail(): boolean {
  return process.env.CI_E2E === '1' || process.env.PLAYWRIGHT_TEST === '1';
}

async function captureE2eEmail(options: EmailOptions): Promise<void> {
  if (!shouldCaptureE2eEmail()) return;

  const outputDir = path.join(process.cwd(), 'tmp', 'e2e-emails');
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID()}.json`;
  await fs.writeFile(
    path.join(outputDir, fileName),
    JSON.stringify({
      createdAt: new Date().toISOString(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? null,
      replyTo: options.replyTo ?? null,
    }, null, 2),
    'utf8',
  );
}

export class LocalProvider extends BaseEmailProvider {
  async send(options: EmailOptions): Promise<void> {
    await captureE2eEmail(options);

    if (process.env.NODE_ENV === 'production') {
      // LocalProvider in production means EMAIL_PROVIDER is misconfigured:
      // never print email content to production stdout, but do not fail silently.
      logger.warn({ msg: 'LocalProvider invoked in production; email suppressed', subject: options.subject });
      return;
    }

    const { to, subject, html, text, replyTo } = options;
    const recipients = this.formatRecipients(to);
    const sender = this.getSenderEmail();
    const border = '═'.repeat(63);
    const separator = '─'.repeat(63);

    const textBlock = text ? `\n\x1b[32mText Content:\x1b[0m\n${redactTokens(text)}\n\x1b[36m${separator}\x1b[0m` : '';
    const replyLine = replyTo ? `\n\x1b[33mReply-To:\x1b[0m ${replyTo}` : '';

    console.log(
      `\n\x1b[36m${border}\x1b[0m\n` +
      `\x1b[36m📧 EMAIL - Local Provider (Development Mode)\x1b[0m\n` +
      `\x1b[36m${border}\x1b[0m\n` +
      `\x1b[33mTo:\x1b[0m       ${recipients}\n` +
      `\x1b[33mFrom:\x1b[0m     ${sender}\n` +
      `\x1b[33mSubject:\x1b[0m ${subject}${replyLine}\n` +
      `\x1b[36m${separator}\x1b[0m\n` +
      `\x1b[32mHTML Content:\x1b[0m\n${redactTokens(html)}\n` +
      `\x1b[36m${separator}\x1b[0m${textBlock}\n`
    );
  }

  getName(): string {
    return 'local';
  }
}
