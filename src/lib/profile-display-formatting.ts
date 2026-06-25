import type { TFunction } from 'i18next';
import { DAYS, TIME_SLOTS } from '@/lib/profile-options';

type ProfileDisplayLanguage = 'en' | 'hu' | 'es';
type TranslationFn = TFunction | ((key: string, fallback?: string) => string);
type AvailabilityDayKey = (typeof DAYS)[number]['key'];
type AvailabilitySlotKey = (typeof TIME_SLOTS)[number]['key'];

export type StructuredAvailabilityDetails = {
  dayKeys: AvailabilityDayKey[];
  selectedSlotsByDay: Partial<Record<AvailabilityDayKey, AvailabilitySlotKey[]>>;
};

const collaborationAliases: Record<string, string> = {
  onetwoone: 'onetwoone',
  'one-to-one': 'onetwoone',
  'one to one': 'onetwoone',
  'one-to-one (1:1)': 'onetwoone',
  'one to one (1:1)': 'onetwoone',
  '1:1': 'onetwoone',
  'egyeni (1:1)': 'onetwoone',
  'individual (1:1)': 'onetwoone',
  group: 'group',
  csoportos: 'group',
  'en grupo': 'group',
  occasional: 'occasional',
  alkalmi: 'occasional',
  ocasional: 'occasional',
  ongoing: 'ongoing',
  folyamatos: 'ongoing',
  continuo: 'ongoing',
  remote: 'remote',
  online: 'remote',
  'online / remote': 'remote',
  'online / tavoli': 'remote',
  'online / remoto': 'remote',
  inperson: 'inperson',
  'in person': 'inperson',
  'in-person': 'inperson',
  personal: 'inperson',
  szemelyes: 'inperson',
  presencial: 'inperson',
};

function normalizeOptionValue(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll('_', ' ')
    .replaceAll(/\s+/g, ' ')
    .toLowerCase();
}

export function getProfileDisplayLanguage(language?: string | null): ProfileDisplayLanguage {
  if (!language) return 'en';
  const normalized = language.toLowerCase();
  if (normalized.startsWith('hu')) return 'hu';
  if (normalized.startsWith('es')) return 'es';
  return 'en';
}

export function normalizeCollaborationPreferenceKey(value: string): string | null {
  const normalized = normalizeOptionValue(value);
  const compact = normalized.replaceAll(/[\s-]/g, '');
  return collaborationAliases[normalized] ?? collaborationAliases[compact] ?? null;
}

function translate(t: TranslationFn, key: string, fallback: string): string {
  const result = t(key, fallback);
  return typeof result === 'string' ? result : fallback;
}

export function formatCollaborationPreferenceLabel(
  value: string,
  t: TranslationFn,
): string {
  const key = normalizeCollaborationPreferenceKey(value);
  if (!key) return value;
  return translate(t, `individual.collaborationStyles.${key}`, value);
}

export function formatCollaborationPreferenceList(
  values: unknown,
  t: TranslationFn,
): string {
  if (Array.isArray(values)) {
    return values
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => formatCollaborationPreferenceLabel(value, t))
      .join(', ');
  }

  if (typeof values === 'string' && values.trim().length > 0) {
    return formatCollaborationPreferenceLabel(values, t);
  }

  return '';
}

function dayLabel(dayKey: string, language: ProfileDisplayLanguage): string {
  const day = DAYS.find((item) => item.key === dayKey);
  if (!day) return dayKey;
  if (language === 'hu') return day.fullHu;
  if (language === 'es') return day.fullEs;
  return day.full;
}

function slotLabel(slotKey: string, language: ProfileDisplayLanguage): string {
  const slot = TIME_SLOTS.find((item) => item.key === slotKey);
  if (!slot) return slotKey;
  if (language === 'hu') return slot.labelHu;
  if (language === 'es') return slot.labelEs;
  return slot.label;
}

function parseAvailabilityDetails(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

const knownSlotKeys = new Set<string>(TIME_SLOTS.map((slot) => slot.key));

function normalizeAvailabilitySlots(value: unknown): AvailabilitySlotKey[] {
  let rawSlots: unknown[];
  if (Array.isArray(value)) {
    rawSlots = value;
  } else if (typeof value === 'string') {
    rawSlots = [value];
  } else {
    rawSlots = [];
  }
  const selected = new Set(
    rawSlots.filter((slot): slot is AvailabilitySlotKey => typeof slot === 'string' && knownSlotKeys.has(slot)),
  );

  return TIME_SLOTS.map((slot) => slot.key).filter((slot): slot is AvailabilitySlotKey => selected.has(slot));
}

export function parseStructuredAvailabilityDetails(value: unknown): StructuredAvailabilityDetails | null {
  const parsed = parseAvailabilityDetails(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const record = parsed as Record<string, unknown>;
  const selectedSlotsByDay: Partial<Record<AvailabilityDayKey, AvailabilitySlotKey[]>> = {};

  for (const day of DAYS) {
    const slots = normalizeAvailabilitySlots(record[day.key]);
    if (slots.length > 0) selectedSlotsByDay[day.key] = slots;
  }

  const dayKeys = DAYS.map((day) => day.key).filter((dayKey): dayKey is AvailabilityDayKey => (selectedSlotsByDay[dayKey]?.length ?? 0) > 0);
  return dayKeys.length > 0 ? { dayKeys, selectedSlotsByDay } : null;
}

function stringifyAvailabilityValue(value: unknown, language: ProfileDisplayLanguage): string {
  if (Array.isArray(value)) {
    return value
      .filter((slot): slot is string => typeof slot === 'string' && slot.trim().length > 0)
      .map((slot) => slotLabel(slot, language))
      .join(', ');
  }
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value);
}

export function formatAvailabilityDetails(value: unknown, language?: string | null): string {
  const parsed = parseAvailabilityDetails(value);
  if (typeof parsed === 'string') return parsed;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return '';

  const displayLanguage = getProfileDisplayLanguage(language);
  const entries = Object.entries(parsed as Record<string, unknown>);
  const dayOrder: Record<string, number> = Object.fromEntries(DAYS.map((day, index) => [day.key, index]));

  return entries
    .toSorted(([left], [right]) => (dayOrder[left] ?? Number.MAX_SAFE_INTEGER) - (dayOrder[right] ?? Number.MAX_SAFE_INTEGER))
    .map(([day, slots]) => {
      const formattedSlots = stringifyAvailabilityValue(slots, displayLanguage);
      if (!formattedSlots) return '';
      return `${dayLabel(day, displayLanguage)}: ${formattedSlots}`;
    })
    .filter(Boolean)
    .join('; ');
}
