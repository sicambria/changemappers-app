'use client';

import Link from 'next/link';
import { useEffect, useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useNotifications } from '@/components/providers';
import { canAccess, type ProfileType } from '@/lib/featureAccess';
import { getMainNavItems, getMapNavItems } from '@/lib/menuConfig';
import {
  FIRST_LOGIN_HELPER_TARGET_EVENT,
  type FirstLoginHelperTargetEventDetail,
  type FirstLoginHelperTourMenu,
} from '@/lib/first-login-helper';
import {
  AlertTriangleIcon,
  BarChart2,
  BookIcon,
  BookOpenIcon,
  CalendarClock,
  CalendarDaysIcon,
  CalendarIcon,
  ChevronDownIcon,
  Compass,
  GiftIcon,
  Globe,
  GraduationCapIcon,
  HandHeartIcon,
  HeartHandshake,
  HeartIcon,
  InfoIcon,
  KanbanIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  LogInIcon,
  LogOutIcon,
  MapIcon,
  MenuIcon,
  MessageCircleIcon,
  MessageSquareDotIcon,
  MessageSquareIcon,
  NetworkIcon,
  PenLineIcon,
  RadioIcon,
  RouteIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  SproutIcon,
  StarIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
  type LucideIcon,
} from 'lucide-react';

import { NotificationList } from '@/components/features/notifications';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Z_CLASS } from '@/lib/z-index';

type NavItem = ReturnType<typeof getMainNavItems>[number];
type IconComponent = LucideIcon | ComponentType<{ className?: string }>;

// NAV GROUP MEMBERSHIP — controls both desktop dropdowns and mobile sections.
// Each constant feeds the same dropdown in both render paths (see renderDesktopDropdown
// and renderMobileSection calls below), so one change covers desktop + mobile.
//
// When adding/removing items from a dropdown:
//   1. Edit the relevant constant below
//   2. Also update menuConfig.ts → mainNavFeatures (item must be in the pool)
//   3. Also update menuConfig.ts → the matching *MenuGroup export (data layer consistency)
//   4. If the feature is new: add to allMenuItems in menuConfig.ts and set access rules in featureAccess.ts
//
// These constants are NOT derived from menuConfig.*MenuGroup — they are parallel copies.
// See docs/architecture/navigation-change-guide.md for the full change guide.
const CONNECT_NAV_FEATURES = ['planet', 'communities', 'connections', 'growth-hub'];
const REFLECT_NAV_FEATURES = new Set(['compass', 'coachme', 'reflect-checkin', 'reflect-deep']);
const LEARN_NAV_FEATURES = ['learning-central', 'stories', 'platform-intro', 'causes'];
const TOOLS_NAV_FEATURES = new Set(['tools', 'graph', 'draw']);
const ACT_NAV_FEATURES = new Set(['kanban', 'pitch', 'contribute', 'scheduling', 'calendar']);

const iconMap: Record<string, IconComponent | null> = {
  Map: MapIcon,
  Users: UsersIcon,
  Calendar: CalendarIcon,
  User: UserIcon,
  Heart: HeartIcon,
  MessageCircle: MessageCircleIcon,
  Settings: SettingsIcon,
  Shield: ShieldIcon,
  Star: StarIcon,
  Book: BookIcon,
  Layers: LayersIcon,
  CalendarDays: CalendarDaysIcon,
  Route: RouteIcon,
  MessageSquare: MessageSquareIcon,
  Sparkles: SparklesIcon,
  HeartHandshake,
  BarChart2,
  Network: NetworkIcon,
  Info: InfoIcon,
  Globe,
  Zap: ZapIcon,
  Compass,
  Rss: MessageSquareIcon,
  Home: null,
  GraduationCap: GraduationCapIcon,
  HandHeart: HandHeartIcon,
  MessageSquareDot: MessageSquareDotIcon,
  Search: SearchIcon,
  BookOpen: BookOpenIcon,
  UserCheck: UserCheckIcon,
  Lightbulb: LightbulbIcon,
  Gift: GiftIcon,
  LayoutDashboard: LayoutDashboardIcon,
  Kanban: KanbanIcon,
  Sprout: SproutIcon,
  CalendarClock,
  AlertTriangle: AlertTriangleIcon,
  PenLine: PenLineIcon,
  Radio: RadioIcon,
};

function getTourTargetForFeature(feature: string, mobile = false): string | undefined {
  const prefix = mobile ? 'mobile-' : '';
  if (feature === 'planet') return `${prefix}planet`;
  if (feature === 'map') return `${prefix}map`;
  return undefined;
}

export function Header() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isEscapeClosed, setIsEscapeClosed] = useState(false);
  const [activeTourMenu, setActiveTourMenu] = useState<FirstLoginHelperTourMenu | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsEscapeClosed(true);
        setActiveTourMenu(null);
        setIsMobileMenuOpen(false);
        setTimeout(() => setIsEscapeClosed(false), 300);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleTourTarget = (event: Event) => {
      const detail = (event as CustomEvent<FirstLoginHelperTargetEventDetail>).detail;
      setActiveTourMenu(detail.menu ?? null);
      setIsEscapeClosed(false);

      if (detail.openMobileMenu === true) {
        setIsMobileMenuOpen(true);
      } else if (detail.openMobileMenu === false) {
        setIsMobileMenuOpen(false);
      }
    };

    globalThis.addEventListener(FIRST_LOGIN_HELPER_TARGET_EVENT, handleTourTarget);
    return () => globalThis.removeEventListener(FIRST_LOGIN_HELPER_TARGET_EVENT, handleTourTarget);
  }, []);

  const profileType = (user?.profileType as ProfileType) || 'GUEST';
  const visibilityOpts = { cmapLevel: user?.cmapLevel, userPrefs: user?.featureVisibilityPreferences };
  const mainNavItems = getMainNavItems(profileType, visibilityOpts);
  const publicMainNavItems = mainNavItems.filter(item => !['social-issues', 'signals'].includes(item.feature));
  const mapNavItems = getMapNavItems(profileType, visibilityOpts);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return;
    }

    fetch('/api/messages/unread-count')
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (data?.count != null) setUnreadMessages(data.count);
      })
      .catch((error: unknown) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Header] Failed to fetch unread message count', error);
        }
      });
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const getDropdownClass = (menu: FirstLoginHelperTourMenu, widthClass: string) => {
    let visibility: string;
    if (isEscapeClosed) {
      visibility = 'opacity-0 invisible pointer-events-none';
    } else if (activeTourMenu === menu) {
      visibility = 'opacity-100 visible pointer-events-auto';
    } else {
      visibility = 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto';
    }

    return `absolute left-0 mt-0 ${widthClass} ${visibility} transition-all duration-200 ${Z_CLASS.headerDropdown} pt-1`;
  };

  const renderIcon = (icon: string, className: string) => {
    const Icon = iconMap[icon];
    return Icon ? <Icon className={className} /> : null;
  };

  const renderDesktopLink = (item: NavItem) => (
    <Link
      key={item.path}
      href={item.path}
      data-tour-target={getTourTargetForFeature(item.feature)}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400"
    >
      {renderIcon(item.icon, 'h-4 w-4')}
      {t(item.translationKey)}
    </Link>
  );

  const renderDesktopDropdown = ({
    menu,
    target,
    labelKey,
    Icon,
    items,
    widthClass = 'w-48',
  }: {
    menu: FirstLoginHelperTourMenu;
    target: string;
    labelKey: string;
    Icon: IconComponent;
    items: NavItem[];
    widthClass?: string;
  }) => (
    <div className="relative group" data-testid="header-dropdown-nav">
      <button
        type="button"
        data-tour-target={target}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800 whitespace-nowrap"
      >
        <Icon className="h-4 w-4" />
        {t(labelKey)}
      </button>
      <div className={getDropdownClass(menu, widthClass)}>
        <div className="py-2 bg-white rounded-lg shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          {items.map(renderDesktopLink)}
        </div>
      </div>
    </div>
  );

  const renderMobileLink = (item: NavItem) => (
    <Link
      key={item.path}
      href={item.path}
      data-tour-target={getTourTargetForFeature(item.feature, true)}
      onClick={() => setIsMobileMenuOpen(false)}
      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
    >
      {renderIcon(item.icon, 'h-5 w-5')}
      {t(item.translationKey)}
    </Link>
  );

  const renderMobileSection = ({
    target,
    labelKey,
    Icon,
    items,
  }: {
    target: string;
    labelKey: string;
    Icon: IconComponent;
    items: NavItem[];
  }) => (
    <>
      <div
        data-tour-target={target}
        className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400 flex items-center gap-2"
      >
        <Icon className="h-3 w-3" /> {t(labelKey)}
      </div>
      {items.map(renderMobileLink)}
    </>
  );

  return (
    <header className={`sticky top-0 ${Z_CLASS.header} w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {t('appName')}
          </span>
        </Link>

        <nav className="hidden xl:flex items-center space-x-1 overflow-visible flex-nowrap">
          {isAuthenticated ? (
            <>
              {renderDesktopDropdown({ menu: 'reflect', target: 'reflect', labelKey: 'nav.reflect', Icon: ZapIcon, items: mainNavItems.filter(item => REFLECT_NAV_FEATURES.has(item.feature)) })}
              {renderDesktopDropdown({ menu: 'connect', target: 'connect', labelKey: 'nav.connect', Icon: UsersIcon, items: CONNECT_NAV_FEATURES.flatMap(feature => mainNavItems.filter(item => item.feature === feature)) })}
              {renderDesktopDropdown({ menu: 'learn', target: 'learn', labelKey: 'nav.learn', Icon: BookIcon, items: LEARN_NAV_FEATURES.flatMap(feature => mainNavItems.filter(item => item.feature === feature)) })}
              {renderDesktopDropdown({ menu: 'map', target: 'map-menu', labelKey: 'nav.map', Icon: MapIcon, items: mapNavItems, widthClass: 'w-52' })}
              {renderDesktopDropdown({ menu: 'tools', target: 'tools', labelKey: 'nav.tools', Icon: BarChart2, items: mainNavItems.filter(item => TOOLS_NAV_FEATURES.has(item.feature)) })}
              {renderDesktopDropdown({ menu: 'act', target: 'act', labelKey: 'nav.act', Icon: HeartHandshake, items: mainNavItems.filter(item => ACT_NAV_FEATURES.has(item.feature)), widthClass: 'w-52' })}
            </>
          ) : (
            publicMainNavItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
              >
                {renderIcon(item.icon, 'h-4 w-4')}
                {t(item.translationKey)}
              </Link>
            ))
          )}
        </nav>

        <div className="hidden xl:flex items-center gap-2">
          {(() => {
          if (isLoading) return <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />;
          if (isAuthenticated) return (
            <div className="flex items-center gap-1">
              <LanguageSwitcher variant="dropdown" />
              <ThemeSwitcher />

              <Link
                href="/help"
                data-tour-target="help"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                aria-label={t('firstLoginHelper.openLabel')}
                title={t('firstLoginHelper.openLabel')}
              >
                <span aria-hidden="true">?</span>
              </Link>

              <div data-tour-target="notifications">
                <NotificationList />
              </div>

              {canAccess(profileType, 'messages') && (
                <Link
                  href="/messages"
                  data-tour-target="messages"
                  className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
                  aria-label={t('nav.messages')}
                >
                  <MessageCircleIcon className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-0.5">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              )}

              <div className="relative group" data-testid="header-dropdown-user">
                <button
                  type="button"
                  data-tour-target="account"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <span className="max-w-[120px] truncate">{user?.displayName || user?.name || t('nav.profile')}</span>
                  <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <div className={`${getDropdownClass('account', 'w-52')} right-0 left-auto z-50`}>
                  <div className="py-1 bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400">
                      <LayoutDashboardIcon className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link href="/profile" data-tour-target="profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400">
                      <UserIcon className="h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                    <Link href="/onboarding" data-tour-target="onboarding" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400">
                      <RouteIcon className="h-4 w-4" />
                      {t('nav.onboarding')}
                    </Link>
                    <Link href="/profile?tab=invite" data-tour-target="invite" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400">
                      <SendIcon className="h-4 w-4" />
                      {t('nav.inviteOthers')}
                    </Link>
                    {user?.isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400">
                        <ShieldIcon className="h-4 w-4" />
                        {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                      <LogOutIcon className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
          return (
            <>
              <LanguageSwitcher variant="dropdown" />
              <ThemeSwitcher />
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors dark:text-gray-300 dark:hover:text-emerald-400">
                {t('nav.login')}
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                {t('nav.register')}
              </Link>
            </>
          );
          })()}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          data-tour-target="mobile-help"
          className="xl:hidden p-2 text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
          aria-label={isMobileMenuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
        >
          {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <nav className="flex flex-col p-4 space-y-1" data-testid="mobile-menu">
            <LanguageSwitcher variant="buttons" />
            <ThemeSwitcher variant="buttons" />

            {isAuthenticated && (
              <Link
                href="/help"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
                aria-label={t('firstLoginHelper.openLabel')}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-sm font-semibold" aria-hidden="true">?</span>
                {t('firstLoginHelper.helpMenu')}
              </Link>
            )}

            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            {isAuthenticated ? (
              <>
                {renderMobileSection({ target: 'mobile-reflect', labelKey: 'nav.reflect', Icon: ZapIcon, items: mainNavItems.filter(item => REFLECT_NAV_FEATURES.has(item.feature)) })}
                {renderMobileSection({ target: 'mobile-connect', labelKey: 'nav.connect', Icon: UsersIcon, items: CONNECT_NAV_FEATURES.flatMap(feature => mainNavItems.filter(item => item.feature === feature)) })}
                {renderMobileSection({ target: 'mobile-learn', labelKey: 'nav.learn', Icon: BookIcon, items: LEARN_NAV_FEATURES.flatMap(feature => mainNavItems.filter(item => item.feature === feature)) })}
                {renderMobileSection({ target: 'mobile-map-menu', labelKey: 'nav.map', Icon: MapIcon, items: mapNavItems })}
                {renderMobileSection({ target: 'mobile-tools', labelKey: 'nav.tools', Icon: BarChart2, items: mainNavItems.filter(item => TOOLS_NAV_FEATURES.has(item.feature)) })}
                {renderMobileSection({ target: 'mobile-act', labelKey: 'nav.act', Icon: HeartHandshake, items: mainNavItems.filter(item => ACT_NAV_FEATURES.has(item.feature)) })}
              </>
            ) : (
              publicMainNavItems.map(renderMobileLink)
            )}

            <hr className="my-2 border-gray-200 dark:border-gray-700" />

            {isAuthenticated ? (
              <>
                <div data-tour-target="mobile-account" className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400 flex items-center gap-2">
                  <UserIcon className="h-3 w-3" /> {t('nav.profile')}
                </div>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                  <LayoutDashboardIcon className="h-5 w-5" />
                  {t('nav.dashboard')}
                </Link>
                {canAccess(profileType, 'messages') && (
                  <Link href="/messages" data-tour-target="mobile-messages" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                    <MessageCircleIcon className="h-5 w-5" />
                    {t('nav.messages')}
                  </Link>
                )}
                <Link href="/profile" data-tour-target="mobile-profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                  <UserIcon className="h-5 w-5" />
                  {t('nav.profile')}
                </Link>
                <Link href="/onboarding" data-tour-target="mobile-onboarding" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                  <RouteIcon className="h-5 w-5" />
                  {t('nav.onboarding')}
                </Link>
                <Link href="/profile?tab=invite" data-tour-target="mobile-invite" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                  <SendIcon className="h-5 w-5" />
                  {t('nav.inviteOthers')}
                </Link>
                {user?.isAdmin && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                    <ShieldIcon className="h-5 w-5" />
                    {t('nav.admin')}
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-gray-800">
                  <LogOutIcon className="h-5 w-5" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800">
                  <LogInIcon className="h-5 w-5" />
                  {t('nav.login')}
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}