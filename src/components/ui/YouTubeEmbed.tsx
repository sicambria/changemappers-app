'use client';

import { useState } from 'react';
import { PlayIcon } from 'lucide-react';

interface YouTubeEmbedProps {
    videoId: string;
    title?: string;
    aspectRatio?: '16/9' | '4/3' | '1/1';
}

export function YouTubeEmbed({
    videoId,
    title = "YouTube video player",
    aspectRatio = '16/9'
}: Readonly<YouTubeEmbedProps>) {
    const [isLoaded, setIsLoaded] = useState(false);

    // High-res thumbnail first, fallback to standard if needed
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    // Padding hack for aspect ratio
    let paddingBottom: string;
    if (aspectRatio === '16/9') {
        paddingBottom = '56.25%';
    } else if (aspectRatio === '4/3') {
        paddingBottom = '75%';
    } else {
        paddingBottom = '100%';
    }

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900"
            style={{ paddingBottom }}
        >
            {isLoaded ? (
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <button
                    onClick={() => setIsLoaded(true)}
                    className="absolute inset-0 w-full h-full group flex items-center justify-center cursor-pointer"
                    aria-label={`Play video ${title}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="relative z-10 w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform group-hover:scale-110 group-hover:bg-red-600">
                        <PlayIcon className="w-8 h-8 ml-1" fill="currentColor" />
                    </div>
                </button>
            )}
        </div>
    );
}
