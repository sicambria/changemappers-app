'use client';

// Profile Completeness Indicator
// Shows users what profile fields are missing to improve discoverability

import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, CircleIcon } from 'lucide-react';

interface ProfileCompletenessProps {
    user: {
        displayName?: string;
        bio?: string;
        location?: string;
        archetypes?: string[];
        profilePhoto?: string;
        skills?: string[];
        interests?: string[];
        isEmailVerified?: boolean;
    };
    compact?: boolean;
}

interface CompletionItem {
    key: string;
    label: string;
    completed: boolean;
    weight: number; // Importance weight for percentage calculation
}

export function ProfileCompleteness({ user, compact = false }: Readonly<ProfileCompletenessProps>) {
    const { t } = useTranslation(['profiles', 'common']);

    const completionItems: CompletionItem[] = [
        {
            key: 'displayName',
            label: t('completeness.displayName'),
            completed: !!user.displayName?.length,
            weight: 15,
        },
        {
            key: 'bio',
            label: t('completeness.bio'),
            completed: (user.bio?.length ?? 0) > 20,
            weight: 20,
        },
        {
            key: 'location',
            label: t('completeness.location'),
            completed: !!user.location,
            weight: 15,
        },
        {
            key: 'archetype',
            label: t('completeness.archetype'),
            completed: !!user.archetypes?.length,
            weight: 20,
        },
        {
            key: 'profilePhoto',
            label: t('completeness.photo'),
            completed: !!user.profilePhoto,
            weight: 10,
        },
        {
            key: 'skills',
            label: t('completeness.skills'),
            completed: !!user.skills?.length,
            weight: 10,
        },
        {
            key: 'emailVerified',
            label: t('completeness.emailVerified'),
            completed: !!user.isEmailVerified,
            weight: 10,
        },
    ];

    const completedWeight = completionItems
        .filter(item => item.completed)
        .reduce((sum, item) => sum + item.weight, 0);

    const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
    const percentage = Math.round((completedWeight / totalWeight) * 100);

    const getProgressColor = (pct: number) => {
        if (pct >= 80) return 'bg-emerald-500';
        if (pct >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getTextColor = (pct: number) => {
        if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
        if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor(percentage)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className={`text-sm font-medium ${getTextColor(percentage)}`}>
                    {percentage}%
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with percentage */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('completeness.title')}
                </h3>
                <span className={`text-lg font-bold ${getTextColor(percentage)}`}>
                    {percentage}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getProgressColor(percentage)} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Checklist */}
            <ul className="space-y-2">
                {completionItems.map((item) => (
                    <li
                        key={item.key}
                        className={`flex items-center gap-2 text-sm ${item.completed
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {item.completed ? (
                            <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                            <CircleIcon className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className={item.completed ? 'line-through' : ''}>
                            {item.label}
                        </span>
                    </li>
                ))}
            </ul>

            {/* Encouragement message */}
            {percentage < 100 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {t('completeness.encouragement')}
                </p>
            )}
        </div>
    );
}
