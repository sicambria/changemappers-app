import { authT, resolveAuthLanguage, type AuthLanguage } from './auth-localization';
import { getEmailProviderCandidates, getOrCreateProvider } from './email/index';
import { escapeHtml, escapeHtmlAttribute } from './html';
import type { EmailOptions, EmailProviderType } from './email/types';

type EmailLanguage = string | null | undefined;

/** Returns null on success, the caught error on failure. */
async function trySendWithProvider(providerName: EmailProviderType, options: EmailOptions, debugEnabled: boolean): Promise<unknown> {
  try {
    if (debugEnabled) console.info(`[email] attempting provider=${providerName} subject="${options.subject}"`);
    await getOrCreateProvider(providerName).send(options);
    if (debugEnabled) console.info(`[email] sent provider=${providerName} subject="${options.subject}"`);
    return null;
  } catch (error) {
    if (debugEnabled) console.warn(`[email] provider=${providerName} failed: ${error instanceof Error ? error.message : String(error)}`);
    return error;
  }
}

async function sendEmail(options: EmailOptions): Promise<void> {
  const debugEnabled = process.env.EMAIL_DEBUG === 'true';
  const providerNames = getEmailProviderCandidates();
  let lastError: unknown = null;

  for (const [idx, providerName] of providerNames.entries()) {
    lastError = await trySendWithProvider(providerName, options, debugEnabled);
    if (lastError === null) return;
    if (idx < providerNames.length - 1) {
      console.warn(`Email provider "${providerName}" failed; trying fallback provider "${providerNames[idx + 1]}".`);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function emailLang(language?: EmailLanguage): AuthLanguage {
  return resolveAuthLanguage(language);
}

function actionButtonHtml(url: string, label: string) {
  return `<a href="${escapeHtmlAttribute(url)}" style="display:inline-block;padding:14px 28px;background:#059669;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;margin:20px 0;font-size:15px;">${escapeHtml(label)}</a>`;
}

function copyUrlHtml(label: string, url: string) {
  return `<p style="color:#6b7280;font-size:12px;margin-top:8px;">${escapeHtml(label)}<br/><a href="${escapeHtmlAttribute(url)}" style="color:#059669;">${escapeHtml(url)}</a></p>`;
}

function simpleAuthEmailHtml(title: string, paragraphs: string[], buttonUrl: string, buttonLabel: string, copyLabel: string) {
  return `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;">
<h2 style="color:#059669;margin-bottom:12px;">${escapeHtml(title)}</h2>
${paragraphs.map((paragraph) => `<p style="color:#374151;line-height:1.5;">${escapeHtml(paragraph)}</p>`).join('\n')}
${actionButtonHtml(buttonUrl, buttonLabel)}
${copyUrlHtml(copyLabel, buttonUrl)}
</div>
`;
}

export async function sendMagicLinkEmail(to: string, magicUrl: string, language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  await sendEmail({
    to,
    subject: authT(lang, 'emails.magic.subject'),
    html: simpleAuthEmailHtml(authT(lang, 'emails.magic.title'), [authT(lang, 'emails.magic.intro'), authT(lang, 'emails.magic.ignore')], magicUrl, authT(lang, 'emails.magic.button'), authT(lang, 'emails.magic.copyUrl')),
    text: authT(lang, 'emails.magic.text', { url: magicUrl }),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  await sendEmail({
    to,
    subject: authT(lang, 'emails.passwordReset.subject'),
    html: simpleAuthEmailHtml(authT(lang, 'emails.passwordReset.title'), [authT(lang, 'emails.passwordReset.intro'), authT(lang, 'emails.passwordReset.expiry'), authT(lang, 'emails.passwordReset.ignore')], resetUrl, authT(lang, 'emails.passwordReset.button'), authT(lang, 'emails.passwordReset.copyUrl')),
    text: authT(lang, 'emails.passwordReset.text', { url: resetUrl }),
  });
}

export async function sendUnreadMessageNotification(email: string, count: number, name?: string): Promise<void> {
  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://changemappers.com';
  const messagesUrl = `${appUrl}/messages`;
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const subject = count === 1 ? 'You have 1 unread message' : `You have ${count} unread messages`;
  const html = `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;">
<h2 style="color:#059669;margin-bottom:12px;">Unread messages</h2>
<p style="color:#374151;line-height:1.5;">${greeting}</p>
<p style="color:#374151;line-height:1.5;">You have <strong>${count}</strong> unread message${count === 1 ? '' : 's'} waiting for you on Changemappers.</p>
${actionButtonHtml(messagesUrl, 'Read your messages')}
${copyUrlHtml('Or paste this link in your browser:', messagesUrl)}
</div>
`;
  const text = `${greeting}\n\nYou have ${count} unread message${count === 1 ? '' : 's'} on Changemappers.\n\nGo to: ${messagesUrl}`;
  await sendEmail({ to: email, subject, html, text });
}

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  inviteCode: string,
  inviteUrl: string,
  options: { subject?: string; comment?: string; language?: EmailLanguage } = {}
): Promise<void> {
  const lang = emailLang(options.language);
  const subject = options.subject?.trim() || authT(lang, 'emails.invite.subject', { inviterName });
  const comment = options.comment?.trim();
  const safeComment = comment ? escapeHtml(comment).replaceAll('\n', '<br/>') : '';
  const commentHtml = safeComment
    ? `<div style="background:#ecfdf5;border-left:4px solid #059669;padding:14px 16px;border-radius:8px;margin:18px 0;color:#064e3b;line-height:1.5;"><strong>${escapeHtml(authT(lang, 'emails.invite.adminCommentLabel'))}</strong><br/>${safeComment}</div>`
    : '';
  const commentBlock = comment ? `\n\n${authT(lang, 'emails.invite.adminCommentLabel')}\n${comment}\n` : '';

  await sendEmail({
    to,
    subject,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:8px;">
<div style="border:1px solid #d1fae5;border-radius:16px;overflow:hidden;background:#fff;">
<div style="background:#059669;padding:24px;color:#fff;"><h1 style="margin:0;font-size:24px;line-height:1.25;">${escapeHtml(authT(lang, 'emails.invite.title'))}</h1><p style="margin:8px 0 0;color:#d1fae5;">${escapeHtml(authT(lang, 'emails.invite.eyebrow'))}</p></div>
<div style="padding:24px;color:#374151;line-height:1.6;">
<p>${escapeHtml(authT(lang, 'emails.invite.intro', { inviterName }))}</p>
${commentHtml}
<p>${escapeHtml(authT(lang, 'emails.invite.codeIntro'))}</p>
<div style="background:#f3f4f6;padding:16px;border-radius:10px;text-align:center;margin:16px 0;"><code style="font-size:24px;font-weight:bold;color:#059669;letter-spacing:1px;">${escapeHtml(inviteCode)}</code></div>
<a href="${escapeHtmlAttribute(inviteUrl)}" style="display:inline-block;padding:13px 24px;background:#059669;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0;">${escapeHtml(authT(lang, 'emails.invite.button'))}</a>
<p style="color:#6b7280;font-size:14px;">${escapeHtml(authT(lang, 'emails.invite.ignore'))}</p>
</div>
</div>
</div>
`,
    text: authT(lang, 'emails.invite.text', { inviterName, commentBlock, inviteCode, url: inviteUrl }),
  });
}

export async function sendLeanVerificationEmail(to: string, verifyUrl: string, language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  const quote = authT(lang, 'emails.leanVerification.quote');
  await sendEmail({
    to,
    subject: authT(lang, 'emails.leanVerification.subject'),
    html: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;">
<h2 style="color:#059669;margin-bottom:12px;">${escapeHtml(authT(lang, 'emails.leanVerification.title'))}</h2>
<p style="color:#374151;font-style:italic;border-left:3px solid #059669;padding-left:12px;margin-bottom:20px;">${escapeHtml(quote)}</p>
<p style="color:#374151;">${escapeHtml(authT(lang, 'emails.leanVerification.body'))}</p>
${actionButtonHtml(verifyUrl, authT(lang, 'emails.leanVerification.button'))}
<p style="color:#9ca3af;font-size:13px;">${escapeHtml(authT(lang, 'emails.leanVerification.ignore'))}</p>
${copyUrlHtml(authT(lang, 'emails.leanVerification.copyUrl'), verifyUrl)}
</div>
`,
    text: authT(lang, 'emails.leanVerification.text', { url: verifyUrl, quote }),
  });
}

export async function sendLeanRegistrationReminderEmail(to: string, continueUrl: string, deletionDate?: Date, language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  const deletionText = deletionDate
    ? authT(lang, 'emails.leanReminder.deletionByDate', { date: deletionDate.toISOString().slice(0, 10) })
    : authT(lang, 'emails.leanReminder.deletionAfterWindow');
  await sendEmail({
    to,
    subject: authT(lang, 'emails.leanReminder.subject'),
    html: simpleAuthEmailHtml(authT(lang, 'emails.leanReminder.title'), [authT(lang, 'emails.leanReminder.intro'), authT(lang, 'emails.leanReminder.body'), deletionText, authT(lang, 'emails.leanReminder.ignore')], continueUrl, authT(lang, 'emails.leanReminder.button'), authT(lang, 'emails.leanReminder.copyUrl')),
    text: authT(lang, 'emails.leanReminder.text', { url: continueUrl, deletionText }),
  });
}

export async function sendInactivityWarningEmail(to: string, daysUntilInactive: number, inactiveDate: Date, accountUrl: string, language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  const inactiveDateText = inactiveDate.toISOString().slice(0, 10);
  await sendEmail({
    to,
    subject: authT(lang, 'emails.inactivityWarning.subject', { days: daysUntilInactive }),
    html: simpleAuthEmailHtml(
      authT(lang, 'emails.inactivityWarning.title'),
      [
        authT(lang, 'emails.inactivityWarning.intro', { date: inactiveDateText }),
        authT(lang, 'emails.inactivityWarning.action', { days: daysUntilInactive }),
        authT(lang, 'emails.inactivityWarning.grace'),
      ],
      accountUrl,
      authT(lang, 'emails.inactivityWarning.button'),
      authT(lang, 'emails.inactivityWarning.copyUrl'),
    ),
    text: authT(lang, 'emails.inactivityWarning.text', { days: daysUntilInactive, date: inactiveDateText, url: accountUrl }),
  });
}

export async function sendInactivityFinalNoticeEmail(to: string, deletionDate: Date, exportUrl: string, accountUrl: string, language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  const deletionDateText = deletionDate.toISOString().slice(0, 10);
  await sendEmail({
    to,
    subject: authT(lang, 'emails.inactivityFinal.subject'),
    html: simpleAuthEmailHtml(
      authT(lang, 'emails.inactivityFinal.title'),
      [
        authT(lang, 'emails.inactivityFinal.intro'),
        authT(lang, 'emails.inactivityFinal.exportWindow', { date: deletionDateText }),
        authT(lang, 'emails.inactivityFinal.reactivate', { url: accountUrl }),
      ],
      exportUrl,
      authT(lang, 'emails.inactivityFinal.button'),
      authT(lang, 'emails.inactivityFinal.copyUrl'),
    ),
    text: authT(lang, 'emails.inactivityFinal.text', { exportUrl, date: deletionDateText, accountUrl }),
  });
}

export async function sendAdminNotification(subject: string, html: string, text: string): Promise<void> {
  const recipients = (process.env.ADMIN_NOTIFICATION_EMAILS || '').split(',').map((email) => email.trim()).filter(Boolean);
  if (recipients.length === 0) {
    console.warn('No admin notification emails configured (ADMIN_NOTIFICATION_EMAILS)');
    return;
  }
  await sendEmail({ to: recipients, subject: `[ADMIN] ${subject}`, html, text });
}

export async function sendAnnouncementEmail(to: string | string[], subject: string, content: string, type: 'INFO' | 'SECURITY', language?: EmailLanguage): Promise<void> {
  const lang = emailLang(language);
  const isSecurity = type === 'SECURITY';
  const accentColor = isSecurity ? '#dc2626' : '#059669';
  const textSubject = isSecurity ? authT(lang, 'emails.announcement.securityTextPrefix', { subject }) : subject;
  const contentHtml = content.split('\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  await sendEmail({
    to,
    subject: isSecurity ? authT(lang, 'emails.announcement.securitySubjectPrefix', { subject }) : subject,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;"><div style="background:${accentColor};padding:20px;color:#fff;text-align:center;"><h1 style="margin:0;font-size:24px;">${escapeHtml(subject)}</h1></div><div style="padding:30px;line-height:1.6;color:#374151;">${contentHtml}</div></div>`,
    text: `${textSubject}\n\n${content}`,
  });
}
