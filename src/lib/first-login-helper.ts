export const FIRST_LOGIN_HELPER_OPEN_EVENT = 'changemappers:first-login-helper:open';
export const FIRST_LOGIN_HELPER_TARGET_EVENT = 'changemappers:first-login-helper:target';

export type FirstLoginHelperTourMenu =
  | 'reflect'
  | 'connect'
  | 'learn'
  | 'map'
  | 'tools'
  | 'act'
  | 'account';

export type FirstLoginHelperTourTarget =
  | 'help'
  | 'notifications'
  | 'messages'
  | 'account'
  | 'reflect'
  | 'connect'
  | 'learn'
  | 'map-menu'
  | 'tools'
  | 'act'
  | 'profile'
  | 'onboarding'
  | 'invite'
  | 'map'
  | 'planet';

export interface FirstLoginHelperTargetEventDetail {
  menu?: FirstLoginHelperTourMenu | null;
  target?: FirstLoginHelperTourTarget | null;
  openMobileMenu?: boolean;
}

export function getFirstLoginHelperStorageKey(userId: string): string {
  return `cm:first-login-helper:dismissed:${userId}`;
}

declare global {
  interface WindowEventMap {
    'changemappers:first-login-helper:target': CustomEvent<FirstLoginHelperTargetEventDetail>;
  }
}