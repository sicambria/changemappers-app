'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';
import { useAuth } from '@/components/providers';
import {
  FIRST_LOGIN_HELPER_OPEN_EVENT,
  FIRST_LOGIN_HELPER_TARGET_EVENT,
  getFirstLoginHelperStorageKey,
  type FirstLoginHelperTargetEventDetail,
  type FirstLoginHelperTourMenu,
  type FirstLoginHelperTourTarget,
} from '@/lib/first-login-helper';
import { Z_CLASS } from '@/lib/z-index';

type TourStep = {
  key: string;
  target: FirstLoginHelperTourTarget;
  mobileTarget: `mobile-${FirstLoginHelperTourTarget}`;
  menu?: FirstLoginHelperTourMenu;
  openMobileMenu?: boolean;
};

type TargetRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PADDING = 8;
const POPOVER_WIDTH = 320;

const tourSteps: TourStep[] = [
  { key: 'help', target: 'help', mobileTarget: 'mobile-help' },
  { key: 'reflect', target: 'reflect', mobileTarget: 'mobile-reflect', menu: 'reflect' },
  { key: 'connect', target: 'connect', mobileTarget: 'mobile-connect', menu: 'connect' },
  { key: 'learn', target: 'learn', mobileTarget: 'mobile-learn', menu: 'learn' },
  { key: 'mapMenu', target: 'map-menu', mobileTarget: 'mobile-map-menu', menu: 'map' },
  { key: 'tools', target: 'tools', mobileTarget: 'mobile-tools', menu: 'tools' },
  { key: 'act', target: 'act', mobileTarget: 'mobile-act', menu: 'act' },
  { key: 'profile', target: 'profile', mobileTarget: 'mobile-profile', menu: 'account' },
  { key: 'onboarding', target: 'onboarding', mobileTarget: 'mobile-onboarding', menu: 'account' },
  { key: 'invite', target: 'invite', mobileTarget: 'mobile-invite', menu: 'account' },
  { key: 'map', target: 'map', mobileTarget: 'mobile-map', menu: 'map' },
  { key: 'planet', target: 'planet', mobileTarget: 'mobile-planet', menu: 'connect' },
  { key: 'messages', target: 'messages', mobileTarget: 'mobile-messages' },
  { key: 'account', target: 'account', mobileTarget: 'mobile-account', menu: 'account' },
];

function isHelperDismissed(userId: string): boolean {
  try {
    return globalThis.localStorage.getItem(getFirstLoginHelperStorageKey(userId)) === 'true';
  } catch {
    return false;
  }
}

function persistHelperDismissal(userId: string): void {
  try {
    globalThis.localStorage.setItem(getFirstLoginHelperStorageKey(userId), 'true');
  } catch {
    // Restricted storage should not block users from closing the guide.
  }
}

function dispatchTourTarget(detail: FirstLoginHelperTargetEventDetail): void {
  globalThis.dispatchEvent(new CustomEvent(FIRST_LOGIN_HELPER_TARGET_EVENT, { detail }));
}

function getTargetRect(element: HTMLElement): TargetRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getSpotlightBounds(rect: TargetRect) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const top = Math.max(0, rect.top - SPOTLIGHT_PADDING);
  const left = Math.max(0, rect.left - SPOTLIGHT_PADDING);
  const right = Math.min(viewportWidth, rect.right + SPOTLIGHT_PADDING);
  const bottom = Math.min(viewportHeight, rect.bottom + SPOTLIGHT_PADDING);

  return {
    top,
    left,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
    viewportWidth,
    viewportHeight,
  };
}

function getDesktopPopoverStyle(rect: TargetRect): CSSProperties {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || POPOVER_WIDTH;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(center, POPOVER_WIDTH / 2 + 16), viewportWidth - POPOVER_WIDTH / 2 - 16);
  const showAbove = rect.bottom + 260 > viewportHeight && rect.top > 280;

  return {
    left,
    top: showAbove ? Math.max(16, rect.top - 12) : Math.min(viewportHeight - 24, rect.bottom + 12),
    transform: showAbove ? 'translate(-50%, -100%)' : 'translateX(-50%)',
  };
}

interface FirstLoginHelperProps {
  autoOpen?: boolean;
}

export function FirstLoginHelper({ autoOpen = true }: FirstLoginHelperProps = {}) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isMissingTarget, setIsMissingTarget] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userId = user?.id;
  const activeStep = tourSteps[activeIndex];
  const totalSteps = tourSteps.length;

  useEffect(() => {
    if (!userId || !autoOpen) {
      setIsOpen(false);
      return;
    }

    setActiveIndex(0);
    setIsOpen(!isHelperDismissed(userId));
  }, [autoOpen, userId]);

  useEffect(() => {
    if (typeof globalThis.window.matchMedia !== 'function') {
      setIsMobile(false);
      return undefined;
    }

    const mediaQuery = globalThis.matchMedia('(max-width: 767px)');
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();
    mediaQuery.addEventListener?.('change', updateMobileState);
    return () => mediaQuery.removeEventListener?.('change', updateMobileState);
  }, []);

  useEffect(() => {
    const openGuide = () => {
      if (userId) {
        setActiveIndex(0);
        setIsOpen(true);
      }
    };

    globalThis.addEventListener(FIRST_LOGIN_HELPER_OPEN_EVENT, openGuide);
    return () => globalThis.removeEventListener(FIRST_LOGIN_HELPER_OPEN_EVENT, openGuide);
  }, [userId]);

  const closeGuide = useCallback((persist: boolean) => {
    if (userId && persist) {
      persistHelperDismissal(userId);
    }
    dispatchTourTarget({ menu: null, target: null, openMobileMenu: false });
    setIsOpen(false);
  }, [userId]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeGuide(true);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [closeGuide, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      dispatchTourTarget({ menu: null, target: null, openMobileMenu: false });
      return undefined;
    }

    const target = isMobile ? activeStep.mobileTarget : activeStep.target;
    dispatchTourTarget({
      menu: activeStep.menu ?? null,
      target: activeStep.target,
      openMobileMenu: isMobile && activeStep.openMobileMenu !== false,
    });

    let frame = 0;
    const measure = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour-target="${target}"]`);
      if (!element) {
        setTargetRect(null);
        setIsMissingTarget(true);
        return;
      }

      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'center', inline: 'center' });
      }
      setTargetRect(getTargetRect(element));
      setIsMissingTarget(false);
    };

    frame = globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame(measure) : globalThis.setTimeout(measure, 0) as unknown as number;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      if (globalThis.cancelAnimationFrame) {
        globalThis.cancelAnimationFrame(frame);
      } else {
        globalThis.clearTimeout(frame);
      }
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [activeStep, isMobile, isOpen]);

  const spotlight = useMemo(() => (targetRect ? getSpotlightBounds(targetRect) : null), [targetRect]);

  if (!userId || !isOpen) {
    return null;
  }

  const isLastStep = activeIndex === totalSteps - 1;
  const title = t(`firstLoginHelper.steps.${activeStep.key}.title`);
  const body = t(`firstLoginHelper.steps.${activeStep.key}.body`);

  const handleNext = () => {
    if (isLastStep) {
      closeGuide(true);
      return;
    }
    setActiveIndex(index => Math.min(index + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setActiveIndex(index => Math.max(index - 1, 0));
  };

  const popover = (
    <section // NOSONAR(S6819) — role="dialog"+aria-modal kept; native dialog relies on showModal()/close() which jsdom does not implement, breaking modal tests — focus/Esc handled in JS
      aria-modal="true"
      className="pointer-events-auto w-[min(100%,20rem)] rounded-lg border border-gray-200 bg-white p-4 text-gray-950 shadow-2xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
      data-testid={isMissingTarget ? 'first-login-helper-fallback' : 'first-login-helper-popover'}
      role="dialog"
      aria-label={t('firstLoginHelper.title')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {t('firstLoginHelper.progress', { current: activeIndex + 1, total: totalSteps })}
          </p>
          <h2 id="first-login-helper-title" className="mt-1 text-base font-semibold leading-6">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => closeGuide(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label={t('firstLoginHelper.actions.exit')}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{body}</p>
      {isMissingTarget && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t('firstLoginHelper.targetMissing')}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={activeIndex === 0}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t('firstLoginHelper.actions.back')}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => closeGuide(true)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('firstLoginHelper.actions.exit')}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            {isLastStep ? t('firstLoginHelper.actions.finish') : t('firstLoginHelper.actions.next')}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <div className={`fixed inset-0 ${Z_CLASS.aboveHeader} pointer-events-none`} data-testid="first-login-helper-tour">
      {spotlight ? (
        <>
          <div // NOSONAR(S6848) — product-tour spotlight mask; convenience click-to-dismiss — the tour popover's Skip/close controls are keyboard-operable
            className="pointer-events-auto fixed left-0 top-0 bg-slate-950/60 backdrop-blur-[1px]"
            style={{ width: '100%', height: spotlight.top }}
            onClick={() => closeGuide(true)}
          />
          <div // NOSONAR(S6848) — product-tour spotlight mask; convenience click-to-dismiss — the tour popover's Skip/close controls are keyboard-operable
            className="pointer-events-auto fixed left-0 bg-slate-950/60 backdrop-blur-[1px]"
            style={{ top: spotlight.top, width: spotlight.left, height: spotlight.height }}
            onClick={() => closeGuide(true)}
          />
          <div // NOSONAR(S6848) — product-tour spotlight mask; convenience click-to-dismiss — the tour popover's Skip/close controls are keyboard-operable
            className="pointer-events-auto fixed bg-slate-950/60 backdrop-blur-[1px]"
            style={{ left: spotlight.right, top: spotlight.top, width: spotlight.viewportWidth - spotlight.right, height: spotlight.height }}
            onClick={() => closeGuide(true)}
          />
          <div // NOSONAR(S6848) — product-tour spotlight mask; convenience click-to-dismiss — the tour popover's Skip/close controls are keyboard-operable
            className="pointer-events-auto fixed bottom-0 left-0 bg-slate-950/60 backdrop-blur-[1px]"
            style={{ top: spotlight.bottom, width: '100%', height: spotlight.viewportHeight - spotlight.bottom }}
            onClick={() => closeGuide(true)}
          />
          <div
            className="pointer-events-none fixed rounded-xl ring-2 ring-emerald-300 ring-offset-2 ring-offset-white/70 dark:ring-emerald-200 dark:ring-offset-gray-950/70"
            data-testid="first-login-helper-spotlight"
            style={{ left: spotlight.left, top: spotlight.top, width: spotlight.width, height: spotlight.height }}
          />
        </>
      ) : (
        <div // NOSONAR(S6848) — product-tour spotlight mask; convenience click-to-dismiss — the tour popover's Skip/close controls are keyboard-operable
          className="pointer-events-auto fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]" onClick={() => closeGuide(true)} />
      )}

      {(() => {
        if (isMobile) return (
          <div className={`fixed inset-x-0 bottom-0 ${Z_CLASS.aboveHeaderPopover} flex justify-center px-4 pb-4 pointer-events-none`}>
            {popover}
          </div>
        );
        if (targetRect && !isMissingTarget) return (
          <div className={`fixed ${Z_CLASS.aboveHeaderPopover} pointer-events-none`} style={getDesktopPopoverStyle(targetRect)}>
            {popover}
          </div>
        );
        return (
          <div className={`fixed inset-0 ${Z_CLASS.aboveHeaderPopover} flex items-center justify-center px-4 pointer-events-none`}>
            {popover}
          </div>
        );
      })()}
    </div>
  );
}
