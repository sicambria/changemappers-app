'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, Settings, ShieldCheck, PieChart } from 'lucide-react';
import Link from 'next/link';
import { Z_CLASS } from '@/lib/z-index';

type ConsentSettings = {
  essential: boolean;
  analytics: boolean;
};

const CONSENT_KEY = 'changemappers-consent';

export function CookieConsent() {
  const { t } = useTranslation('common');
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // GDPR requires optional categories to default to false (opt-in, not opt-out).
  const [settings, setSettings] = useState<ConsentSettings>({
    essential: true,
    analytics: false,
  });

  const readSavedConsent = (): ConsentSettings | null => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as Partial<ConsentSettings>;
      return { essential: true, analytics: parsed.analytics === true };
    } catch {
      return null;
    }
  };

  const clearAnalyticsVisitSession = () => {
    const keysToRemove: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith('visited:')) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  };

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const openSettings = () => {
      const saved = readSavedConsent();
      if (saved) setSettings(saved);
      setExpanded(true);
      setShow(true);
    };

    globalThis.addEventListener('open-cookie-settings', openSettings);

    if (globalThis.navigator.webdriver) {
      return () => globalThis.removeEventListener('open-cookie-settings', openSettings);
    }

    const saved = readSavedConsent();
    if (saved) {
      setSettings(saved);
      return () => globalThis.removeEventListener('open-cookie-settings', openSettings);
    }

    const timer = setTimeout(() => setShow(true), 2000);
    return () => {
      clearTimeout(timer);
      globalThis.removeEventListener('open-cookie-settings', openSettings);
    };
  }, []);

  const saveConsent = (s: ConsentSettings) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...s, timestamp: new Date().toISOString() }));
    setSettings(s);
    setShow(false);
    if (!s.analytics) clearAnalyticsVisitSession();
    globalThis.dispatchEvent(new CustomEvent('consent-updated', { detail: s }));
  };

  const handleAcceptAll = () => saveConsent({ essential: true, analytics: true });
  const handleDeclineAll = () => saveConsent({ essential: true, analytics: false });
  const handleSavePreferences = () => saveConsent(settings);

  if (!show) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${Z_CLASS.topChrome} p-4 md:p-6 pointer-events-none`}>
        <div className="max-w-4xl mx-auto w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl pointer-events-auto overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{t('cookieConsent.title')}</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                {t('cookieConsent.description')}
              </p>
              <div className="mt-1">
                <Link href="/privacy" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {t('privacy.title', 'Privacy Policy')}
                </Link>
              </div>
              
              {expanded && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                         <ShieldCheck className="w-5 h-5 text-green-500" />
                         <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Required</span>
                      </div>
                      <p className="font-semibold text-sm">{t('cookieConsent.essential')}</p>
                      <p className="text-xs text-zinc-500 mt-1">{t('cookieConsent.essentialDesc')}</p>
                    </div>

                    <label className="relative p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                         <PieChart className="w-5 h-5 text-blue-500" />
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-primary bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-primary" 
                           checked={settings.analytics}
                           onChange={(e) => setSettings({ ...settings, analytics: e.target.checked })}
                         />
                      </div>
                      <p className="font-semibold text-sm">{t('cookieConsent.analytics')}</p>
                      <p className="text-xs text-zinc-500 mt-1">{t('cookieConsent.analyticsDesc')}</p>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              {expanded ? (
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
                >
                  {t('actions.save')}
                </button>
              ) : (
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
                >
                  {t('cookieConsent.accept')}
                </button>
              )}
              <button
                onClick={handleDeclineAll}
                className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]"
              >
                {t('cookieConsent.decline')}
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                {t('cookieConsent.settings')}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
