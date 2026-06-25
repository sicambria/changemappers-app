'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ShieldAlertIcon,
  UsersIcon,
  TentIcon,
  CalendarIcon,
  CheckCircleIcon,
  DatabaseIcon,
  GaugeIcon,
  GlobeIcon,
  BarChartIcon,
  RouteIcon,
  LayoutDashboardIcon,
  UserPlusIcon,
  MessageSquareIcon,
  LightbulbIcon,
  RadioIcon,
  QuoteIcon,
  FlaskConicalIcon,
  XIcon,
} from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
  className?: string;
}

export function AdminSidebar({ onClose, className }: Readonly<AdminSidebarProps>) {
  const { t } = useTranslation(['admin', 'common']);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const accentMap: Record<string, { active: string; hover: string; icon: string }> = {
    emerald: { active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', hover: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10', icon: 'text-emerald-500' },
    red: { active: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', hover: 'hover:bg-red-50/50 dark:hover:bg-red-900/10', icon: 'text-red-500' },
    blue: { active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', hover: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10', icon: 'text-blue-500' },
    purple: { active: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', hover: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10', icon: 'text-purple-500' },
    indigo: { active: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', hover: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10', icon: 'text-indigo-500' },
    amber: { active: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', hover: 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10', icon: 'text-amber-500' },
    teal: { active: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', hover: 'hover:bg-teal-50/50 dark:hover:bg-teal-900/10', icon: 'text-teal-500' },
    green: { active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', hover: 'hover:bg-green-50/50 dark:hover:bg-green-900/10', icon: 'text-green-500' },
  };

  const navItems = [
    { id: 'overview', label: t('sidebar.overview'), icon: LayoutDashboardIcon, href: '/admin', accent: 'emerald' },
    { id: 'reports', label: t('reports.title'), icon: ShieldAlertIcon, href: '/admin?tab=reports', accent: 'red' },
    { id: 'data', label: t('sidebar.dataManagement'), icon: DatabaseIcon, href: '/admin?tab=data', accent: 'blue' },
    { id: 'users', label: t('sidebar.users'), icon: UsersIcon, href: '/admin?tab=users', accent: 'blue' },
    { id: 'communities', label: t('sidebar.communities'), icon: TentIcon, href: '/admin?tab=communities', accent: 'emerald' },
    { id: 'events', label: t('sidebar.events'), icon: CalendarIcon, href: '/admin?tab=events', accent: 'purple' },
    { id: 'registrations', label: t('sidebar.registrations'), icon: UserPlusIcon, href: '/admin?tab=registrations', accent: 'teal' },
    { id: 'routes', label: t('sidebar.routes'), icon: RouteIcon, href: '/admin?tab=routes', accent: 'indigo' },
    { id: 'performance', label: t('sidebar.performance'), icon: GaugeIcon, href: '/admin?tab=performance', accent: 'blue' },
    { id: 'analytics', label: t('sidebar.analytics'), icon: BarChartIcon, href: '/admin?tab=analytics', accent: 'emerald' },
    { id: 'feedback', label: t('sidebar.feedback'), icon: MessageSquareIcon, href: '/admin?tab=feedback', accent: 'teal' },
    { id: 'ideas', label: t('sidebar.ideas'), icon: LightbulbIcon, href: '/admin?tab=ideas', accent: 'emerald' },
    { id: 'experimental', label: t('sidebar.experimentalFeatures'), icon: FlaskConicalIcon, href: '/admin?tab=experimental', accent: 'purple' },
  ];

  const externalLinks = [
    { id: 'announcements', label: t('sidebar.announcements'), icon: ShieldAlertIcon, href: '/admin/announcements', accent: 'red' },
    { id: 'balance', label: t('sidebar.burnoutPrevention'), icon: ShieldAlertIcon, href: '/admin/balance', accent: 'amber' },
    { id: 'health', label: t('sidebar.communityHealth'), icon: GlobeIcon, href: '/admin/health', accent: 'teal' },
    { id: 'claims', label: t('sidebar.claims'), icon: CheckCircleIcon, href: '/admin/claims', accent: 'green' },
    { id: 'security', label: t('sidebar.securityCenter'), icon: ShieldAlertIcon, href: '/admin/security', accent: 'red' },
    { id: 'radio-stations', label: t('sidebar.radioStations'), icon: RadioIcon, href: '/admin/radio-stations', accent: 'purple' },
    { id: 'quotes', label: t('sidebar.quotes'), icon: QuoteIcon, href: '/admin/quotes', accent: 'amber' },
  ];

  const isItemActive = (item: { id: string; href: string }) => {
    if (item.href.includes('?tab=')) {
      const tab = new URLSearchParams(item.href.split('?')[1]).get('tab');
      return pathname === '/admin' && activeTab === tab;
    }
    if (item.href === '/admin') {
      return pathname === '/admin' && activeTab === 'overview';
    }
    return pathname === item.href;
  };

  const renderItem = (item: { id: string; label: string; icon: React.ElementType; href: string; accent?: string }) => {
    const accent = accentMap[item.accent ?? 'blue'];
    const isActive = isItemActive(item);

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          isActive
            ? `${accent.active} border-current/20`
            : `border-transparent text-gray-600 dark:text-gray-400 ${accent.hover} hover:text-gray-900 dark:hover:text-white`
        }`}
        onClick={onClose}
      >
        <item.icon className={`shrink-0 w-4 h-4 ${isActive ? '' : accent.icon}`} />
        <span className="flex-1 text-left">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between mb-3 lg:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('sidebar.navigation')}</span>
        {onClose && (
          <button onClick={onClose}>
            <XIcon className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-1 hidden lg:block">
        {t('sidebar.adminPanel')}
      </p>

      {navItems.map(renderItem)}

      <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-1">
        {t('sidebar.subpages')}
      </p>
      {externalLinks.map(renderItem)}
    </aside>
  );
}
