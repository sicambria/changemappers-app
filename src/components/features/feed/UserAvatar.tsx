'use client';

import * as React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function UserAvatar({ src, alt, size = 'md', className }: Readonly<UserAvatarProps>) {
  const initials = alt.charAt(0).toUpperCase();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback className="text-sm font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
