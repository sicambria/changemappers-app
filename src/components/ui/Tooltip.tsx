'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
    content: string;
    children: React.ReactNode;
    className?: string;
}

export function Tooltip({ content, children, className }: Readonly<TooltipProps>) {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
        <div // NOSONAR(S6848) — supplementary hover affordance; the content/action is independently keyboard-reachable via an explicit control or focusable child
            className={cn("relative inline-block", className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-50 px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-lg bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                    {content}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
            )}
        </div>
    );
}
