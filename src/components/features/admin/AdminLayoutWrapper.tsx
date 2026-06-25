'use client';

import { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuIcon, XIcon } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { usePathname, useSearchParams } from 'next/navigation';

function AdminLayoutInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useTranslation(['admin']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine current title based on path/params
  const getPageTitle = () => {
    if (pathname === '/admin/claims') return t('sidebar.claims');
    if (pathname === '/admin/health') return t('sidebar.communityHealth');
    if (pathname === '/admin/balance') return t('sidebar.burnoutPrevention');
    if (pathname === '/admin/announcements') return t('sidebar.announcements');
    if (pathname === '/admin/security') return t('sidebar.securityCenter');
    
    const tab = searchParams.get('tab');
    switch (tab) {
        case 'reports': return t('reports.title');
        case 'data': return t('sidebar.dataManagement');
        case 'users': return t('sidebar.users');
        case 'communities': return t('sidebar.communities');
        case 'events': return t('sidebar.events');
        case 'registrations': return t('sidebar.registrations');
        case 'routes': return t('sidebar.routes');
        case 'performance': return t('sidebar.performance');
        case 'analytics': return t('sidebar.analytics');
        case 'feedback': return t('sidebar.feedback');
        default: return t('sidebar.overview');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('dashboard.welcome')}
          </p>
        </div>
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500"
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label={t('sidebar.openMenu')}
        >
          {sidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex gap-6 relative">
        {/* Sidebar — desktop always visible, mobile overlay */}
        <>
          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div // NOSONAR(S6848) — full-viewport click-away layer dismissing an open menu; the trigger and items are keyboard-operable and dismiss on blur/Esc — a native control would be a viewport-wide bogus tab stop
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar panel */}
          <AdminSidebar 
            onClose={() => setSidebarOpen(false)}
            className={`
              fixed top-0 left-0 h-full z-50 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 transition-transform overflow-y-auto
              lg:static lg:z-auto lg:h-auto lg:w-56 lg:shrink-0 lg:rounded-xl lg:border lg:translate-x-0 lg:shadow-sm
              ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}
            `}
          />
        </>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb / current section title */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <span>{t('sidebar.adminPanel')}</span>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{getPageTitle()}</span>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminLayoutWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const { t } = useTranslation(['admin']);
    return (
        <Suspense fallback={<div className="p-8 text-center">{t('dashboard.loading')}</div>}>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </Suspense>
    );
}
