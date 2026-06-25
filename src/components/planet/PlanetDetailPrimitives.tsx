'use client';

import React from 'react';
import { CalendarDays, MapPin, Radio, UserRound, UsersRound } from 'lucide-react';
import type { MapEntity } from '@/app/actions/map';

export function EntityTypeIcon({ type }: Readonly<{ type: MapEntity['type'] }>) {
    const className = 'h-3.5 w-3.5';
    if (type === 'individual') return <UserRound className={className} />;
    if (type === 'community') return <UsersRound className={className} />;
    if (type === 'event') return <CalendarDays className={className} />;
    if (type === 'issue') return <MapPin className={className} />;
    return <Radio className={className} />;
}

export function ChipList({ values, tone = 'slate' }: Readonly<{ values: string[]; tone?: 'slate' | 'sky' | 'emerald' | 'amber' | 'rose' }>) {
    if (values.length === 0) return null;
    const toneClass = {
        slate: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/75',
        sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
        rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
    }[tone];

    return (
        <div className="flex flex-wrap gap-1.5">
            {values.map((value) => (
                <span key={value} className={`px-2 py-1 rounded-full text-xs font-medium ${toneClass}`}>
                    {value}
                </span>
            ))}
        </div>
    );
}

export function DetailSection({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
    if (!children) return null;
    return (
        <section className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/45">{title}</h4>
            {children}
        </section>
    );
}

export function DetailRow({ label, value }: Readonly<{ label: string; value: string | null | undefined }>) {
    if (!value) return null;
    return (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-b-0 dark:border-white/10">
            <span className="text-slate-500 dark:text-white/50">{label}</span>
            <span className="max-w-[60%] text-right font-medium text-slate-800 dark:text-white/85">{value}</span>
        </div>
    );
}
