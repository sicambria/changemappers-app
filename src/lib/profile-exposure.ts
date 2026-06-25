import { Visibility } from '@/lib/prisma-shared';
import { normalizeFediverseSettings, type PublicProfileExposureSettings } from '@/lib/federation/settings';

export type ProfileExposureSettings = PublicProfileExposureSettings;

export function getProfileExposureSettings(rawSettings: unknown): ProfileExposureSettings {
  return normalizeFediverseSettings(rawSettings).publicProfile;
}

export function canExposeProfileField(
  settings: ProfileExposureSettings,
  field: keyof ProfileExposureSettings,
  privileged = false,
): boolean {
  return privileged || settings[field] === true;
}

export function canViewerOpenProfile(input: {
  targetUserId: string;
  targetProfileVisibility: string | null | undefined;
  viewerId?: string | null;
  isAdmin?: boolean;
  connectedUserIds?: ReadonlySet<string>;
}): boolean {
  const { targetUserId, targetProfileVisibility, viewerId, isAdmin, connectedUserIds } = input;
  if (isAdmin || viewerId === targetUserId) return true;
  if (targetProfileVisibility === Visibility.PUBLIC) return true;
  if (targetProfileVisibility === Visibility.REGISTERED) return Boolean(viewerId);
  if (targetProfileVisibility === Visibility.CONNECTIONS) {
    return Boolean(viewerId && connectedUserIds?.has(targetUserId));
  }
  return false;
}

export function splitProfileSkills<T extends { skill: string; skillType: string }>(
  skills: T[] | null | undefined,
  settings: ProfileExposureSettings,
  privileged = false,
): { skills: string[]; offers: string[]; needs: string[] } {
  const allSkills = skills ?? [];
  return {
    skills: canExposeProfileField(settings, 'showSkills', privileged)
      ? allSkills.filter((item) => item.skillType === 'EXPERIENCE').map((item) => item.skill)
      : [],
    offers: canExposeProfileField(settings, 'showOffers', privileged)
      ? allSkills.filter((item) => item.skillType === 'OFFERED').map((item) => item.skill)
      : [],
    needs: canExposeProfileField(settings, 'showNeeds', privileged)
      ? allSkills.filter((item) => item.skillType === 'SEEKING').map((item) => item.skill)
      : [],
  };
}

export function toVisibleStringArray(
  value: unknown,
  settings: ProfileExposureSettings,
  field: keyof ProfileExposureSettings,
  privileged = false,
): string[] {
  if (!canExposeProfileField(settings, field, privileged)) return [];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
