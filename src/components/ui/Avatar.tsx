'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Simple Avatar implementation without Radix UI dependency for MVP

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            className
        )}
        {...props}
    />
));
Avatar.displayName = "Avatar";

interface AvatarImageProps {
    className?: string;
    src?: string;
    alt?: string;
}

const AvatarImage = React.forwardRef<
    HTMLDivElement,
    AvatarImageProps
>(({ className, src, alt }, ref) => {
    if (!src) return null;
    return (
        <div ref={ref} className="absolute inset-0">
            <Image
                src={src}
                alt={alt || "Avatar"}
                fill
                className={cn("object-cover", className)}
                unoptimized
            />
        </div>
    );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground bg-gray-100 dark:bg-gray-800",
            className
        )}
        {...props}
    />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
