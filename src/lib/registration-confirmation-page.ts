import { NextResponse } from 'next/server';
import { authT, resolveAuthLanguage, type AuthLanguage } from './auth-localization';

const LANGUAGE_COOKIE = 'cm_ui_language';
const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const LANGUAGE_LABELS: Record<AuthLanguage, string> = {
  en: 'English',
  hu: 'Magyar',
  es: 'Español',
};

type ConfirmationMode = 'lean' | 'full';

export function setLanguageCookie(response: NextResponse, language: string | null | undefined, secure: boolean) {
  response.cookies.set(LANGUAGE_COOKIE, resolveAuthLanguage(language), {
    sameSite: 'lax',
    secure,
    maxAge: LANGUAGE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
}

export function renderRegistrationConfirmationPage(options: {
  token: string;
  formAction: string;
  nonce?: string | null;
  language?: string | null;
  mode: ConfirmationMode;
  backHref: string;
}) {
  const lang = resolveAuthLanguage(options.language);
  const prefix = `tokenPages.${options.mode}`;
  const safeToken = escapeHtml(options.token);
  const formAction = withLanguage(options.formAction, lang);
  const styleNonce = options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';
  const languageLinks = (['en', 'hu', 'es'] as const).map((language) => {
    const href = `?token=${encodeURIComponent(options.token)}&lang=${language}`;
    const selected = language === lang;
    return `<a class="lang${selected ? ' selected' : ''}" href="${href}" lang="${language}" hreflang="${language}">${escapeHtml(LANGUAGE_LABELS[language])}</a>`;
  }).join('');

  return new NextResponse(`<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>${escapeHtml(authT(lang, `${prefix}.title`))}</title>
    <style${styleNonce}>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f3f8f5; color: #17211b; }
      body::before { content: ""; position: fixed; inset: 0; background: radial-gradient(circle at 18% 18%, rgba(4, 120, 87, 0.16), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.9), rgba(218,238,226,0.72)); }
      main { position: relative; width: min(92vw, 520px); padding: 36px; border: 1px solid #c7dbcf; border-radius: 8px; background: rgba(255,255,255,0.96); box-shadow: 0 24px 70px rgba(20, 45, 32, 0.16); }
      .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; color: #047857; font-weight: 800; letter-spacing: 0; }
      .mark { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 8px; background: #dff5e9; color: #03543f; }
      .language { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: -8px 0 24px; color: #607165; font-size: 0.82rem; }
      .lang { margin: 0; padding: 5px 8px; border-radius: 6px; color: #047857; font-weight: 700; text-decoration: none; }
      .lang:hover, .lang.selected { background: #dff5e9; color: #03543f; }
      .eyebrow { margin: 0 0 8px; color: #047857; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
      h1 { margin: 0 0 12px; font-size: 1.9rem; line-height: 1.18; letter-spacing: 0; }
      p { margin: 0; color: #47584d; line-height: 1.6; }
      .notice { margin: 24px 0; padding: 14px 16px; border: 1px solid #cfe7d8; border-radius: 8px; background: #f0faf4; color: #30503d; font-size: 0.95rem; }
      form { margin-top: 24px; }
      button { width: 100%; border: 0; border-radius: 6px; background: #047857; color: white; min-height: 50px; padding: 0 18px; font: inherit; font-weight: 800; cursor: pointer; }
      button:hover { background: #03664a; }
      button:focus-visible { outline: 3px solid #86efac; outline-offset: 2px; }
      .back { display: inline-block; margin-top: 18px; color: #047857; font-weight: 700; }
      @media (max-width: 520px) { main { padding: 28px 22px; } h1 { font-size: 1.55rem; } }
    </style>
  </head>
  <body>
    <main>
      <div class="brand"><span class="mark">CM</span><span>Changemappers</span></div>
      <nav class="language" aria-label="${escapeHtml(authT(lang, 'tokenPages.languageLabel'))}"><span>${escapeHtml(authT(lang, 'tokenPages.languageLabel'))}</span>${languageLinks}</nav>
      <p class="eyebrow">${escapeHtml(authT(lang, `${prefix}.eyebrow`))}</p>
      <h1>${escapeHtml(authT(lang, `${prefix}.heading`))}</h1>
      <p>${escapeHtml(authT(lang, `${prefix}.body`))}</p>
      <div class="notice">${escapeHtml(authT(lang, `${prefix}.notice`))}</div>
      <form method="post" action="${escapeHtml(formAction)}">
        <input type="hidden" name="token" value="${safeToken}" />
        <input type="hidden" name="lang" value="${lang}" />
        <button type="submit">${escapeHtml(authT(lang, `${prefix}.button`))}</button>
      </form>
      <a class="back" href="${escapeHtml(options.backHref)}">${escapeHtml(authT(lang, `${prefix}.back`))}</a>
    </main>
  </body>
</html>`, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export function withLanguage(url: string, language: string | null | undefined) {
  const lang = resolveAuthLanguage(language);
  const parsed = new URL(url, 'http://local.invalid');
  parsed.searchParams.set('lang', lang);
  if (url.startsWith('http://') || url.startsWith('https://')) return parsed.toString();
  return `${parsed.pathname}${parsed.search}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
