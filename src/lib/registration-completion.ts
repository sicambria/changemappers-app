export const PENDING_REGISTRATION_NAME = '_pending_';

type PendingRegistrationAccountInput = {
  isRegistrationPending?: boolean | null;
  name?: string | null;
  passwordHash?: string | null;
};

export function isPendingRegistrationAccount(user: PendingRegistrationAccountInput | null | undefined): boolean {
  if (!user) return false;
  if (user.isRegistrationPending === true) return true;
  return user.name === PENDING_REGISTRATION_NAME;
}
