import prisma, { AccountDeletionReason } from '@/lib/prisma';
import { sendInactivityFinalNoticeEmail, sendInactivityWarningEmail } from '@/lib/email';
import { buildAbsoluteUrl } from '@/lib/site-url';
import {
  INACTIVITY_DAYS,
  INACTIVITY_DELETE_AFTER_DAYS,
  daysAfter,
  daysBefore,
  getInactivityDeletionDate,
} from '@/lib/user-activity';

export type InactivityMaintenanceResult = {
  warning30Count: number;
  warning15Count: number;
  warning3Count: number;
  markedInactiveCount: number;
};

type WarningConfig = {
  daysUntilInactive: 30 | 15 | 3;
  sentField: 'inactivityWarning30SentAt' | 'inactivityWarning15SentAt' | 'inactivityWarning3SentAt';
};

const WARNING_CONFIGS: WarningConfig[] = [
  { daysUntilInactive: 30, sentField: 'inactivityWarning30SentAt' },
  { daysUntilInactive: 15, sentField: 'inactivityWarning15SentAt' },
  { daysUntilInactive: 3, sentField: 'inactivityWarning3SentAt' },
];

function baseEligibleWhere() {
  return {
    deletedAt: null,
    isAdmin: false,
    isRegistrationPending: false,
  };
}

export async function sendInactivityWarnings(now = new Date()): Promise<Pick<InactivityMaintenanceResult, 'warning30Count' | 'warning15Count' | 'warning3Count'>> {
  const counts = { warning30Count: 0, warning15Count: 0, warning3Count: 0 };

  for (const config of WARNING_CONFIGS) {
    const threshold = daysBefore(now, INACTIVITY_DAYS - config.daysUntilInactive);
    const inactiveCutoff = daysBefore(now, INACTIVITY_DAYS);
    const users = await prisma.user.findMany({
      where: {
        ...baseEligibleWhere(),
        inactiveAt: null,
        lastActiveAt: { lte: threshold, gt: inactiveCutoff },
        [config.sentField]: null,
      },
      select: { id: true, email: true, lastActiveAt: true, uiLanguage: true },
      orderBy: { lastActiveAt: 'asc' },
      take: 200,
    });

    for (const user of users) {
      await sendInactivityWarningEmail(
        user.email,
        config.daysUntilInactive,
        daysAfter(user.lastActiveAt, INACTIVITY_DAYS),
        buildAbsoluteUrl('/login'),
        user.uiLanguage,
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { [config.sentField]: now },
        select: { id: true },
      });
      if (config.daysUntilInactive === 30) counts.warning30Count += 1;
      if (config.daysUntilInactive === 15) counts.warning15Count += 1;
      if (config.daysUntilInactive === 3) counts.warning3Count += 1;
    }
  }

  return counts;
}

export async function markInactiveUsers(now = new Date()): Promise<{ markedInactiveCount: number }> {
  const inactiveCutoff = daysBefore(now, INACTIVITY_DAYS);
  const users = await prisma.user.findMany({
    where: {
      ...baseEligibleWhere(),
      inactiveAt: null,
      lastActiveAt: { lte: inactiveCutoff },
    },
    select: { id: true, email: true, lastActiveAt: true, uiLanguage: true },
    orderBy: { lastActiveAt: 'asc' },
    take: 200,
  });

  let markedInactiveCount = 0;
  for (const user of users) {
    const deletionDate = getInactivityDeletionDate(user.lastActiveAt);
    await sendInactivityFinalNoticeEmail(
      user.email,
      deletionDate,
      buildAbsoluteUrl('/api/gdpr/export'),
      buildAbsoluteUrl('/login'),
      user.uiLanguage,
    );
    await prisma.user.update({
      where: { id: user.id },
      data: {
        inactiveAt: now,
        scheduledDeletionAt: deletionDate,
        scheduledDeletionReason: AccountDeletionReason.INACTIVITY,
        inactivityFinalNoticeSentAt: now,
      },
      select: { id: true },
    });
    markedInactiveCount += 1;
  }

  return { markedInactiveCount };
}

export async function runInactivityMaintenance(now = new Date()): Promise<InactivityMaintenanceResult> {
  const warnings = await sendInactivityWarnings(now);
  const inactive = await markInactiveUsers(now);
  return { ...warnings, ...inactive };
}

export { INACTIVITY_DAYS, INACTIVITY_DELETE_AFTER_DAYS };
