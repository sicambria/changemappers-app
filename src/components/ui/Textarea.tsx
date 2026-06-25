// Textarea component
// Multi-line text input with consistent styling

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <textarea
                    className={cn(
                        'flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
                        'placeholder:text-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100',
                        'dark:placeholder:text-gray-500 dark:focus:ring-emerald-600',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea };
