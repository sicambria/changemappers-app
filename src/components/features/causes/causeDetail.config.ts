// Domain visual config and topic-icon helper — no JSX, no 'use client' needed

import {
    Brain, Leaf, TrendingUp, Scale, Anchor, HeartHandshake,
} from 'lucide-react';
import type React from 'react';

export const DOMAIN_CONFIG: Record<number, {
    icon: React.ElementType;
    gradient: string;
    heroBg: string;
    badge: string;
    accent: string;
    border: string;
    buttonBg: string;
}> = {
    1: {
        icon: Brain,
        gradient: 'from-emerald-600 to-teal-700',
        heroBg: 'from-emerald-950 via-teal-900 to-emerald-950',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        accent: 'text-emerald-500',
        border: 'border-emerald-500',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    2: {
        icon: Leaf,
        gradient: 'from-emerald-600 to-green-700',
        heroBg: 'from-emerald-950 via-green-900 to-emerald-950',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        accent: 'text-emerald-500',
        border: 'border-emerald-500',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    3: {
        icon: TrendingUp,
        gradient: 'from-amber-600 to-yellow-700',
        heroBg: 'from-amber-950 via-yellow-900 to-amber-950',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        accent: 'text-amber-500',
        border: 'border-amber-500',
        buttonBg: 'bg-amber-600 hover:bg-amber-700',
    },
    4: {
        icon: Scale,
        gradient: 'from-cyan-600 to-cyan-700',
        heroBg: 'from-cyan-950 via-cyan-900 to-teal-950',
        badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
        accent: 'text-cyan-500',
        border: 'border-cyan-500',
        buttonBg: 'bg-cyan-600 hover:bg-cyan-700',
    },
    5: {
        icon: Anchor,
        gradient: 'from-rose-600 to-red-700',
        heroBg: 'from-rose-950 via-red-900 to-rose-950',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
        accent: 'text-rose-500',
        border: 'border-rose-500',
        buttonBg: 'bg-rose-600 hover:bg-rose-700',
    },
};

export const DEFAULT_DOMAIN = {
    icon: HeartHandshake,
    gradient: 'from-slate-600 to-slate-700',
    heroBg: 'from-slate-950 via-slate-900 to-slate-950',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    accent: 'text-slate-500',
    border: 'border-slate-400',
    buttonBg: 'bg-slate-600 hover:bg-slate-700',
};

export function getTopicIcon(websites: string | null): string {
    const match = websites?.match(/icon:([^|]+)/);
    return match?.[1] ?? '';
}
