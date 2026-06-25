'use client';

// Client-side layout wrapper component
// Provides i18n, language, and auth contexts and renders Header/Footer

import { ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { I18nProvider, AuthProvider, NotificationProvider, useAuth } from '@/components/providers';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import type { CurrentUserData } from '@/lib/get-current-user';
import { Header } from './Header';
import { Footer } from './Footer';
import { PulseBanner } from './PulseBanner';
import { AnnouncementBanner } from './AnnouncementBanner';
import { CookieConsent } from './CookieConsent';
import { BottomBanner } from './BottomBanner';
import { FirstLoginHelper } from './FirstLoginHelper';
import { usePageVisitTracking } from '@/hooks';

const FULLSCREEN_PATHS = ['/draw', '/planet', '/canvas', '/energy', '/map', '/graph'];
const APP_CHROME_WIDGET_DISABLED_PATHS = ['/reflect/helpers', '/tools/helpers'];
const FULLSCREEN_ROUTE_CLASS = 'fullscreen-zoom-route';
const FeedbackButton = dynamic(() => import('@/components/features/feedback/FeedbackButton').then(module => module.FeedbackButton), {
  ssr: false,
});
const Toaster = dynamic(() => import('@/components/ui/sonner').then(module => module.Toaster), { ssr: false });

interface ClientLayoutProps {
  children: ReactNode;
  initialLanguage?: string | null;
  initialUser?: CurrentUserData | null;
  feedbackConfig?: { enabled: boolean; position: 'bottom-right' | 'bottom-left' };
}

// Inner wrapper: reads user.uiLanguage from AuthProvider and passes to LanguageProvider
function LanguageAwareLayout({
  children,
  initialLanguage,
  feedbackConfig,
}: Readonly<{
  children: ReactNode;
  initialLanguage?: string | null;
  feedbackConfig?: { enabled: boolean; position: 'bottom-right' | 'bottom-left' };
}>) {
  const { user } = useAuth();
  const pathname = usePathname();
  usePageVisitTracking(!!user);

  const isFullscreen = FULLSCREEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const shouldRenderAppChromeWidgets = !APP_CHROME_WIDGET_DISABLED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const shouldAutoOpenFirstLoginHelper = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle(FULLSCREEN_ROUTE_CLASS, isFullscreen);
    body.classList.toggle(FULLSCREEN_ROUTE_CLASS, isFullscreen);

    if (!isFullscreen) {
      delete root.dataset.fullscreenZoomRoute;
      delete body.dataset.fullscreenZoomRoute;
      return undefined;
    }

    root.dataset.fullscreenZoomRoute = 'true';
    body.dataset.fullscreenZoomRoute = 'true';

    const preventDocumentWheel = (event: WheelEvent) => {
      event.preventDefault();
    };

    window.addEventListener('wheel', preventDocumentWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventDocumentWheel);
      root.classList.remove(FULLSCREEN_ROUTE_CLASS);
      body.classList.remove(FULLSCREEN_ROUTE_CLASS);
      delete root.dataset.fullscreenZoomRoute;
      delete body.dataset.fullscreenZoomRoute;
    };
  }, [isFullscreen]);

  return (
    <LanguageProvider initialLanguage={user?.uiLanguage ?? initialLanguage}>
      <NotificationProvider>
        <div className={
          isFullscreen
            ? 'flex h-dvh overflow-hidden flex-col'
            : 'flex min-h-screen flex-col pb-12 sm:pb-14'
        }>
          <AnnouncementBanner />
          <PulseBanner />
          <Header />
          <main className={isFullscreen ? 'min-h-0 flex-1 overflow-hidden' : 'flex-1'}>{children}</main>
          {!isFullscreen && <Footer />}
          <CookieConsent />
          {shouldRenderAppChromeWidgets && (
            <>
              <FeedbackButton enabled={feedbackConfig?.enabled} position={feedbackConfig?.position} />
              <Toaster />
              <FirstLoginHelper autoOpen={shouldAutoOpenFirstLoginHelper} />
            </>
          )}
        </div>
        {!isFullscreen && <BottomBanner />}
      </NotificationProvider>
    </LanguageProvider>
  );
}

export function ClientLayout({ children, initialLanguage, initialUser, feedbackConfig }: Readonly<ClientLayoutProps>) {
  return (
    <I18nProvider initialLanguage={initialLanguage}>
      <AuthProvider initialUser={initialUser}>
        <ThemeProvider>
          <LanguageAwareLayout initialLanguage={initialLanguage} feedbackConfig={feedbackConfig}>
            {children}
          </LanguageAwareLayout>
        </ThemeProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
