"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/components/ui';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { IdeaBoard } from '@/components/features/roadmap/ideas/IdeaBoard';

export default function RoadmapPageClient() {
    const { t } = useTranslation(['roadmap', 'common']);

    const milestones = [
        { key: 'mvp', icon: CheckCircle2, color: 'text-green-500' },
        { key: 'phase2', icon: Circle, color: 'text-blue-500' },
        { key: 'phase3', icon: Circle, color: 'text-purple-500' }
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t('backToHome', { ns: 'roadmap' })}
                    </Button>
                </Link>
            </div>

            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {t('title', { ns: 'roadmap' })}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {t('description', { ns: 'roadmap' })}
                </p>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {milestones.map((m) => (
                    <div key={m.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white dark:bg-gray-800 dark:border-gray-700 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <m.icon className={`w-5 h-5 ${m.color}`} />
                        </div>
                        {/* Card */}
                        <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-lg">{t(`milestones.${m.key}.title`, { ns: 'roadmap' })}</h3>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    {t(`milestones.${m.key}.status`, { ns: 'roadmap' })}
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {t(`milestones.${m.key}.description`, { ns: 'roadmap' })}
                            </p>
                        </Card>
                    </div>
                ))}
            </div>

            <IdeaBoard />

            <div className="mt-20 text-center p-12 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-900/20">
                <h2 className="text-3xl font-bold mb-4 text-green-800 dark:text-green-300">
                    {t('waitForUs', { ns: 'roadmap' })}
                </h2>
                <p className="text-green-700 dark:text-green-400 mb-8 max-w-lg mx-auto">
                    {t('waitForUsDescription', { ns: 'roadmap' })}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a href="https://changemappers.org/" target="_blank" rel="noopener noreferrer">
                        <Button className="rounded-full px-8">
                            {t('contact', { ns: 'roadmap' })}
                        </Button>
                    </a>
                    <a href="https://changemappers.substack.com/subscribe" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8">
                            {t('followUs', { ns: 'roadmap' })}
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}
