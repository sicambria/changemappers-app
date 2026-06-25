import type { PermissionActor } from './community';

export function canModerateContent(actor: Pick<PermissionActor, 'isAdmin' | 'isModerator'> | null | undefined) {
  return actor?.isAdmin === true || actor?.isModerator === true;
}

export function assertCanModerateContent(actor: Pick<PermissionActor, 'isAdmin' | 'isModerator'> | null | undefined) {
  if (!canModerateContent(actor)) {
    throw new Error('Forbidden');
  }
}
