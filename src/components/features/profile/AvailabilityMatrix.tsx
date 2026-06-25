'use client';

import { useTranslation } from 'react-i18next';
import { DAYS, TIME_SLOTS, type AvailabilityMatrix } from './profile-form-schema';

export function AvailabilityMatrixGrid({ value, onChange }: Readonly<{
    value: AvailabilityMatrix;
    onChange: (v: AvailabilityMatrix) => void;
}>) {
    const { t } = useTranslation(['profiles']);
    const isOn = (day: string, slot: string) => (value[day] || []).includes(slot);

    const toggle = (day: string, slot: string) => {
        const cur = value[day] || [];
        onChange({
            ...value,
            [day]: cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot],
        });
    };

    const toggleDay = (day: string) => {
        const allOn = TIME_SLOTS.every(s => isOn(day, s.key));
        onChange({
            ...value,
            [day]: allOn ? [] : TIME_SLOTS.map(s => s.key),
        });
    };

    const toggleSlot = (slot: string) => {
        const allOn = DAYS.every(d => isOn(d.key, slot));
        const next = { ...value };
        DAYS.forEach(d => {
            const cur = next[d.key] || [];
            next[d.key] = allOn ? cur.filter(s => s !== slot) : [...new Set([...cur, slot])];
        });
        onChange(next);
    };

    return (
        <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
                <thead>
                    <tr>
                        <th className="p-1 min-w-[72px]"></th>
                        {DAYS.map(day => (
                            <th key={day.key} className="p-1 text-center min-w-[36px]">
                                <button
                                    type="button"
                                    title={t('edit.availability.toggleDay', { day: day.full })}
                                    onClick={() => toggleDay(day.key)}
                                    className="font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors w-8 text-center"
                                >
                                    {day.label}
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {TIME_SLOTS.map(slot => (
                        <tr key={slot.key} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="p-1">
                                <button
                                    type="button"
                                    title={t('edit.availability.toggleSlot', { slot: slot.label })}
                                    onClick={() => toggleSlot(slot.key)}
                                    className="text-left hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors leading-tight"
                                >
                                    <span className="font-semibold text-gray-600 dark:text-gray-400 block">{slot.label}</span>
                                    <span className="text-gray-400 font-normal text-[10px]">{slot.sub}</span>
                                </button>
                            </td>
                            {DAYS.map(day => (
                                <td key={day.key} className="p-1 text-center">
                                    <button
                                        type="button"
                                        onClick={() => toggle(day.key, slot.key)}
                                        title={`${day.full} — ${slot.label}`}
                                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all border ${
                                            isOn(day.key, slot.key)
                                                ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-gray-700 border-transparent text-gray-300 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                        }`}
                                        aria-pressed={isOn(day.key, slot.key)}
                                        aria-label={`${day.full} ${slot.label}`}
                                    >
                                        {isOn(day.key, slot.key) ? '✓' : ''}
                                    </button>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="mt-1.5 text-xs text-gray-400">{t('edit.availability.help')}</p>
        </div>
    );
}
