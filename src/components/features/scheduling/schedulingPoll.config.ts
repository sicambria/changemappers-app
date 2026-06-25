export type SlotMode = 'single' | 'range';

export interface TimeSlot {
  id: string;
  date: string;
  endDate?: string;
  mode: SlotMode;
  times: { id: string; start: string; end: string }[];
  isFullDay: boolean;
}

export const TIME_PRESETS = {
  morning: { start: '09:00', end: '12:00' },
  afternoon: { start: '14:00', end: '17:00' },
  evening: { start: '18:00', end: '21:00' },
  'full-day': { start: '09:00', end: '18:00' },
};

export const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: '+3 days', days: 3 },
  { label: '+7 days', days: 7 },
  { label: '+14 days', days: 14 },
  { label: '+21 days', days: 21 },
  { label: '+30 days', days: 30 },
];

export const INITIAL_SLOTS: TimeSlot[] = [
  { id: 'initial-slot-1', date: '', mode: 'single', times: [], isFullDay: true },
  { id: 'initial-slot-2', date: '', mode: 'single', times: [], isFullDay: true },
];

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function formatDateForInput(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
