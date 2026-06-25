import { DAYS, TIME_SLOTS } from '@/lib/profile-options';
import {
  getProfileDisplayLanguage,
  type StructuredAvailabilityDetails,
} from '@/lib/profile-display-formatting';

type AvailabilityDetailsTableProps = {
  availability: StructuredAvailabilityDetails;
  label: string;
  language?: string | null;
  selectedLabel?: string;
  unselectedLabel?: string;
  className?: string;
};

function dayLabel(day: (typeof DAYS)[number], language: ReturnType<typeof getProfileDisplayLanguage>): string {
  if (language === 'hu') return day.labelHu;
  if (language === 'es') return day.labelEs;
  return day.label;
}

function dayFullLabel(day: (typeof DAYS)[number], language: ReturnType<typeof getProfileDisplayLanguage>): string {
  if (language === 'hu') return day.fullHu;
  if (language === 'es') return day.fullEs;
  return day.full;
}

function slotLabel(slot: (typeof TIME_SLOTS)[number], language: ReturnType<typeof getProfileDisplayLanguage>): string {
  if (language === 'hu') return slot.labelHu;
  if (language === 'es') return slot.labelEs;
  return slot.label;
}

export function AvailabilityDetailsTable({
  availability,
  label,
  language,
  selectedLabel = 'Available',
  unselectedLabel = 'Not available',
  className = '',
}: Readonly<AvailabilityDetailsTableProps>) {
  const displayLanguage = getProfileDisplayLanguage(language);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table aria-label={label} className="w-full min-w-[28rem] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th scope="col" className="w-24 px-1 py-1 text-left font-medium text-gray-500 dark:text-gray-400">
              <span className="sr-only">{label}</span>
            </th>
            {DAYS.map((day) => (
              <th key={day.key} scope="col" className="px-1 py-1 text-center font-semibold text-gray-600 dark:text-gray-300" title={dayFullLabel(day, displayLanguage)}>
                {dayLabel(day, displayLanguage)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot.key}>
              <th scope="row" className="whitespace-nowrap px-1 py-1 text-left font-medium text-gray-600 dark:text-gray-300">
                <span>{slotLabel(slot, displayLanguage)}</span>
                <span className="ml-1 text-[10px] font-normal text-gray-400">{slot.sub}</span>
              </th>
              {DAYS.map((day) => {
                const selected = availability.selectedSlotsByDay[day.key]?.includes(slot.key) ?? false;
                const cellLabel = `${dayFullLabel(day, displayLanguage)} ${slotLabel(slot, displayLanguage)}: ${selected ? selectedLabel : unselectedLabel}`;

                return (
                  <td key={`${day.key}-${slot.key}`} aria-label={cellLabel} className="p-1 text-center">
                    <span
                      aria-hidden="true"
                      className={`mx-auto block h-6 w-6 rounded border ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-200 dark:ring-emerald-700'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
                      }`}
                    >
                      {selected ? <span className="block h-full w-full rounded-sm bg-white/20" /> : null}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}