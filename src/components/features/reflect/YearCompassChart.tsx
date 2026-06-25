'use client';

import { Radar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

interface YearCompassChartProps {
    chartData: number[];
    onChartDataChange: (newData: number[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function YearCompassChart({ chartData, onChartDataChange }: Readonly<YearCompassChartProps>) {
    const { t } = useTranslation('reflect');

    const radarData = {
        labels: [
            t('yearCompass.past.lifeAreas.labels.family'),
            t('yearCompass.past.lifeAreas.labels.career'),
            t('yearCompass.past.lifeAreas.labels.friends'),
            t('yearCompass.past.lifeAreas.labels.health'),
            t('yearCompass.past.lifeAreas.labels.mental'),
            t('yearCompass.past.lifeAreas.labels.habits')
        ],
        datasets: [{
            label: t('yearCompass.past.lifeAreas.balance'),
            data: chartData,
            backgroundColor: 'rgba(212, 163, 115, 0.2)',
            borderColor: '#D4A373',
            pointBackgroundColor: '#D4A373',
            pointBorderColor: '#fff',
            fill: true,
        }]
    };

    const radarOptions: ChartOptions<'radar'> = {
        scales: {
            r: {
                beginAtZero: true,
                max: 10,
                ticks: { stepSize: 2, display: false },
                grid: { color: 'rgba(0,0,0,0.05)' },
                angleLines: { color: 'rgba(0,0,0,0.05)' },
                pointLabels: {
                    font: { size: 10 },
                    color: '#666'
                }
            }
        },
        plugins: {
            legend: { display: false }
        },
        maintainAspectRatio: false
    };

    const lifeAreaKeys = ['family', 'career', 'friends', 'health', 'mental', 'habits'] as const;

    return (
        <div className="grid min-w-0 gap-8 md:grid-cols-12">
            {/* Sliders */}
            <div className="min-w-0 space-y-6 overflow-hidden rounded-lg border border-l-4 border-journal-secondary bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900/50 sm:p-8 md:col-span-5">
                <h3 className="break-words font-serif text-xl">{t('yearCompass.past.lifeAreas.title')}</h3>
                <p className="break-words text-sm text-gray-600">{t('yearCompass.past.lifeAreas.desc')}</p>
                <div className="space-y-6">
                    {lifeAreaKeys.map((key, idx) => (
                        <div key={key} className="space-y-1">
                            <div className="flex min-w-0 justify-between gap-3 text-xs font-bold uppercase text-gray-500">
                                <span className="min-w-0 break-words">{t(`yearCompass.past.lifeAreas.labels.${key}`)}</span>
                                <span className="text-journal-secondary">{chartData[idx]}</span>
                            </div>
                            <input
                                type="range" min="1" max="10"
                                value={chartData[idx]}
                                onChange={(e) => {
                                    const newData = [...chartData];
                                    newData[idx] = Number.parseInt(e.target.value);
                                    onChartDataChange(newData);
                                }}
                                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-journal-secondary"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Radar chart */}
            <div className="flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900/50 sm:p-8 md:col-span-7 md:min-h-[400px]">
                <h4 className="font-serif text-lg text-gray-700 mb-8">{t('yearCompass.past.lifeAreas.balance')}</h4>
                <div className="relative h-[260px] w-full max-w-[240px] min-w-0 overflow-hidden sm:h-[300px] sm:max-w-full md:h-full">
                    <Radar data={radarData} options={radarOptions} />
                </div>
            </div>
        </div>
    );
}
