import Link from 'next/link';
import {
  BookIcon,
  GlobeIcon,
  SparklesIcon,
  ZapIcon,
  LayersIcon,
  HeartHandshakeIcon,
  GraduationCapIcon,
  ArrowRightIcon,
  CompassIcon,
} from 'lucide-react';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('learning');
  return {
    title: `${t('learningCentral.metaTitle')} — Changemappers`,
    description: t('learningCentral.metaDescription'),
  };
}

export default async function LearningCentralPage() {
  const { t: tCommon } = await getServerTranslation('common');
  const { t: tLearning } = await getServerTranslation('learning');

  const LEARNING_PATHS = [
    {
      icon: CompassIcon,
      color: 'bg-emerald-100 text-emerald-700',
      href: '/learn/metamodels',
      title: tLearning('learningCentral.paths.metamodels.title'),
      desc: tLearning('learningCentral.paths.metamodels.desc'),
      goal: tLearning('learningCentral.paths.metamodels.goal'),
    },
    {
      icon: GlobeIcon,
      color: 'bg-blue-100 text-blue-700',
      href: '/learn/traditions',
      title: tLearning('learningCentral.paths.traditions.title'),
      desc: tLearning('learningCentral.paths.traditions.desc'),
      goal: tLearning('learningCentral.paths.traditions.goal'),
    },
    {
      icon: SparklesIcon,
      color: 'bg-purple-100 text-purple-700',
      href: '/learn/skills',
      title: tLearning('learningCentral.paths.skills.title'),
      desc: tLearning('learningCentral.paths.skills.desc'),
      goal: tLearning('learningCentral.paths.skills.goal'),
    },
    {
      icon: ZapIcon,
      color: 'bg-orange-100 text-orange-700',
      href: '/learn/patterns',
      title: tLearning('learningCentral.paths.patterns.title'),
      desc: tLearning('learningCentral.paths.patterns.desc'),
      goal: tLearning('learningCentral.paths.patterns.goal'),
    },
    {
      icon: BookIcon,
      color: 'bg-yellow-100 text-yellow-700',
      href: '/glossary',
      title: tLearning('learningCentral.paths.glossary.title'),
      desc: tLearning('learningCentral.paths.glossary.desc'),
      goal: tLearning('learningCentral.paths.glossary.goal'),
    },
    {
      icon: HeartHandshakeIcon,
      color: 'bg-rose-100 text-rose-700',
      href: '/causes',
      title: tLearning('learningCentral.paths.causes.title'),
      desc: tLearning('learningCentral.paths.causes.desc'),
      goal: tLearning('learningCentral.paths.causes.goal'),
    },
    {
      icon: GraduationCapIcon,
      color: 'bg-teal-100 text-teal-700',
      href: '/learn',
      title: tLearning('learningCentral.paths.programs.title'),
      desc: tLearning('learningCentral.paths.programs.desc'),
      goal: tLearning('learningCentral.paths.programs.goal'),
    },
    {
      icon: LayersIcon,
      color: 'bg-indigo-100 text-indigo-700',
      href: '/stories',
      title: tLearning('learningCentral.paths.stories.title'),
      desc: tLearning('learningCentral.paths.stories.desc'),
      goal: tLearning('learningCentral.paths.stories.goal'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <BookIcon className="h-4 w-4" />
            {tCommon('nav.learningCentral')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            {tLearning('learningCentral.what')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {tLearning('learningCentral.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {LEARNING_PATHS.map((path) => {
            const Icon = path.icon;
            return (
              <Link
                key={path.href}
                href={path.href}
                className="group flex gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${path.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {path.title}
                    </h2>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mb-1.5 italic">&ldquo;{path.goal}&rdquo;</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{path.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center p-6 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-600 mb-4">
            {tLearning('learningCentral.cta.textBefore')} <strong>{tLearning('learningCentral.cta.compassName')}</strong> {tLearning('learningCentral.cta.textAfter')}
          </p>
          <Link
            href="/compass"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
          >
            <CompassIcon className="h-4 w-4" />
            {tLearning('learningCentral.cta.button')}
          </Link>
        </div>
      </div>
    </div>
  );
}
