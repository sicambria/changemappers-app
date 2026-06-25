'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface CategoryData {
  id: string;
  chartData: number[];
}

const CATEGORIES: CategoryData[] = [
  { id: 'SEN-01', chartData: [90, 100, 30, 20, 80] },
  { id: 'ATT-02', chartData: [100, 50, 10, 80, 60] },
  { id: 'MOV-03', chartData: [70, 60, 100, 40, 50] },
  { id: 'REL-04', chartData: [80, 40, 20, 90, 40] },
  { id: 'OBS-05', chartData: [90, 50, 20, 100, 60] },
  { id: 'RIT-06', chartData: [100, 40, 10, 80, 70] },
  { id: 'SEA-07', chartData: [100, 30, 10, 80, 90] },
  { id: 'MIC-08', chartData: [100, 40, 10, 60, 100] },
];

const BASELINE_DATA = [100, 10, 10, 90, 10];
const STRONG_SEGMENT_PATTERN = /(<strong>[^<]*<\/strong>)/g;
const STRONG_EXACT_PATTERN = /^<strong>([^<]*)<\/strong>$/;

function StrongTranslation({ value }: Readonly<{ value: string }>) {
  return (
    <>
      {value.split(STRONG_SEGMENT_PATTERN).map((part, index) => {
        const match = STRONG_EXACT_PATTERN.exec(part);
        if (match) {
          return <strong key={`strong-${index}-${match[1]}`}>{match[1]}</strong>;
        }

        return <span key={`text-${index}-${part}`}>{part}</span>;
      })}
    </>
  );
}

export function ConnectNatureClient() {
  const { t } = useTranslation('modalities');
  const [catIndex, setCatIndex] = useState(0);

  const chartLabels: string[] = [
    t('connectNature.chartLabels.accessibility'),
    t('connectNature.chartLabels.sensoryDepth'),
    t('connectNature.chartLabels.physicalMovement'),
    t('connectNature.chartLabels.cognitiveRest'),
    t('connectNature.chartLabels.timeEfficiency'),
  ];

  const cat = CATEGORIES[catIndex];
  const catTitle = t(`connectNature.categories.${cat.id}.title`);
  const catExplanation = t(`connectNature.categories.${cat.id}.explanation`);
  const catWhy = t(`connectNature.categories.${cat.id}.why`);
  const catExamples: string[] = [
    t(`connectNature.categories.${cat.id}.examples.0`),
    t(`connectNature.categories.${cat.id}.examples.1`),
    t(`connectNature.categories.${cat.id}.examples.2`),
  ];
  const adaptForest = t(`connectNature.categories.${cat.id}.adaptations.forest`);
  const adaptPark = t(`connectNature.categories.${cat.id}.adaptations.park`);
  const adaptBalcony = t(`connectNature.categories.${cat.id}.adaptations.balcony`);
  const adaptIndoor = t(`connectNature.categories.${cat.id}.adaptations.indoor`);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('connectNature.chartBaseline'),
        data: BASELINE_DATA,
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        borderColor: 'rgba(148, 163, 184, 1)',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: catTitle,
        data: cat.chartData,
        backgroundColor: 'rgba(47, 82, 51, 0.4)',
        borderColor: 'rgba(47, 82, 51, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(47, 82, 51, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        grid: { color: 'rgba(0,0,0,0.1)' },
        pointLabels: {
          font: { size: 10 },
          color: '#4a5568',
          padding: 5,
        },
        ticks: { display: false as const, min: 0, max: 100 },
      },
    },
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12 } },
    },
  };

  const whyLoseItems = [t('connectNature.whyLose1'), t('connectNature.whyLose2'), t('connectNature.whyLose3')];
  const justBeingItems = [t('connectNature.justBeing1'), t('connectNature.justBeing2'), t('connectNature.justBeing3')];

  return (
    <div className="antialiased pb-20 overflow-x-hidden" style={{ backgroundColor: '#f9f8f6', color: '#2d3748' }}>
      <header className="py-16 px-6 relative overflow-hidden" style={{ backgroundColor: '#2f5233', color: '#f9f8f6' }}>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-4 text-sm font-semibold tracking-wider uppercase" style={{ color: 'rgba(167, 243, 208, 0.8)' }}>{t('connectNature.headerTag')}</div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">{t('connectNature.heroTitle')}</h1>
          <p className="text-xl md:text-2xl max-w-2xl font-light mb-8" style={{ color: '#ecfdf5' }}>{t('connectNature.heroSub')}</p>
          <a
            href="#practices"
            className="inline-block font-semibold py-3 px-6 rounded-lg shadow transition-colors hover:bg-white"
            style={{ backgroundColor: '#f9f8f6', color: '#2f5233' }}
          >
            {t('connectNature.heroBtn')}
          </a>
        </div>
        <div className="absolute -bottom-24 -right-24 text-[300px] opacity-10 select-none pointer-events-none">🌿</div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12 space-y-20">
        <section id="context" className="scroll-mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#2f5233' }}>{t('connectNature.contextTitle')}</h2>
            <p className="text-lg text-gray-700 max-w-3xl">{t('connectNature.contextDesc')}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-3xl mb-4">🧱</div>
              <h3 className="text-xl font-bold mb-3">{t('connectNature.whyLoseTitle')}</h3>
              <ul className="space-y-3 text-gray-600">
                {whyLoseItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-bold" style={{ color: '#2f5233' }}>•</span>
<span><StrongTranslation value={item} /></span>
      </li>
    ))}
  </ul>
</div>
<div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
  <div className="text-3xl mb-4">🚶‍♂️</div>
  <h3 className="text-xl font-bold mb-3">{t('connectNature.justBeingTitle')}</h3>
  <p className="text-gray-600 mb-4">{t('connectNature.justBeingSub')}</p>
  <ul className="space-y-3 text-gray-600">
    {justBeingItems.map((item) => (
      <li key={item} className="flex gap-2">
        <span className="font-bold" style={{ color: '#2f5233' }}>•</span>
        <span><StrongTranslation value={item} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="practices" className="scroll-mt-12 bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-gray-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#2f5233' }}>{t('connectNature.catalogTitle')}</h2>
            <p className="text-lg text-gray-700">{t('connectNature.catalogDesc')}</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-1/3 flex flex-col gap-2">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setCatIndex(i)}
                  className="text-left px-4 py-3 rounded-lg font-semibold text-sm w-full border transition-colors"
                  style={
                    i === catIndex
                      ? { backgroundColor: '#2f5233', color: 'white', borderColor: '#2f5233' }
                      : { backgroundColor: 'white', color: '#374151', borderColor: '#e5e7eb' }
                  }
                >
                  <span className="opacity-50 font-mono text-xs mr-2">{c.id.split('-')[1]}</span>
                  {t(`connectNature.categories.${c.id}.title`)}
                </button>
              ))}
            </div>

            <div className="lg:w-2/3 flex flex-col gap-8">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-2xl font-bold" style={{ color: '#2f5233' }}>{catTitle}</h3>
                  <span className="text-sm font-mono bg-gray-100 text-gray-500 py-1 px-2 rounded">{cat.id}</span>
                </div>
                <p className="text-lg text-gray-600 italic">{catExplanation}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <h4 className="font-bold text-gray-800 mb-2">{t('connectNature.profileTitle')}</h4>
                  <div className="relative w-full" style={{ maxWidth: 500, margin: '0 auto', height: 300 }}>
                    <Radar data={chartData} options={chartOptions} />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-3" style={{ color: '#2f5233' }}>{t('connectNature.whyHelpsTitle')}</h4>
                  <p className="text-gray-700 leading-relaxed p-5 rounded-xl border-l-4" style={{ backgroundColor: '#ecfdf5', borderColor: '#2f5233' }}>{catWhy}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xl text-gray-800 mb-4">{t('connectNature.examplesTitle')}</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catExamples.map((ex) => (
                    <li key={ex} className="bg-white p-3 rounded border border-gray-100 shadow-sm flex gap-3 text-sm text-gray-700">
                      <span className="mt-0.5" style={{ color: '#2f5233' }}>🌿</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-xl text-gray-800 mb-4">{t('connectNature.adaptTitle')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: '🌲', label: t('connectNature.adaptForest'), text: adaptForest },
                    { icon: '🌳', label: t('connectNature.adaptPark'), text: adaptPark },
                    { icon: '🪴', label: t('connectNature.adaptBalcony'), text: adaptBalcony },
                    { icon: '🪟', label: t('connectNature.adaptIndoor'), text: adaptIndoor },
                  ].map(({ icon, label, text }) => (
                    <div key={label} className="bg-stone-100 p-4 rounded-lg">
                      <div className="text-2xl mb-2">{icon}</div>
                      <h5 className="font-bold text-sm mb-2 text-stone-700">{label}</h5>
                      <p className="text-sm text-gray-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center" style={{ backgroundColor: '#2f5233' }}>
            <h2 className="text-2xl font-bold mb-4">{t('connectNature.smallestTitle')}</h2>
            <p className="mb-6 italic" style={{ color: '#a7f3d0' }}>{t('connectNature.smallestSub')}</p>
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <h3 className="font-bold text-lg mb-2">{t('connectNature.smallestName')}</h3>
              <p className="text-sm leading-relaxed">{t('connectNature.smallestDesc')}</p>
            </div>
          </div>
          <div className="md:col-span-2 p-8 rounded-3xl shadow-sm border border-gray-200" style={{ backgroundColor: '#e9ece5' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#2f5233' }}>{t('connectNature.shortlistTitle')}</h2>
            <p className="text-gray-700 mb-6">{t('connectNature.shortlistDesc')}</p>
            <div className="space-y-4">
              {[
                { icon: '☕', title: t('connectNature.sl1Title'), desc: t('connectNature.sl1Desc') },
                { icon: '👟', title: t('connectNature.sl2Title'), desc: t('connectNature.sl2Desc') },
                { icon: '🐦', title: t('connectNature.sl3Title'), desc: t('connectNature.sl3Desc') },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 items-start bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl">{icon}</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{title}</h4>
                    <p className="text-gray-600 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-10 text-gray-500 text-sm mt-10">
        <p>{t('connectNature.footerText')}</p>
      </footer>
    </div>
  );
}
