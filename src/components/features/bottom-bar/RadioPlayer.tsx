'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, Volume2Icon, VolumeXIcon, Loader2Icon } from 'lucide-react';
import type { BottomBarSettings } from '@/app/actions/bottom-bar-settings';

interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string | null;
  language: string | null;
}

interface RadioPlayerProps {
  stations: RadioStation[];
  settings: BottomBarSettings;
  onSettingsChange: (update: Partial<BottomBarSettings>) => void;
}

export function RadioPlayer({ stations, settings, onSettingsChange }: Readonly<RadioPlayerProps>) {
  const { t } = useTranslation('common');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  const currentStationIndex = stations.findIndex((s) => s.id === settings.lastStationId);
  const currentStation = currentStationIndex >= 0 ? stations[currentStationIndex] : stations[0];

  const playStation = useCallback((station: RadioStation | undefined) => {
    if (!station) return;
    setHasError(false);
    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = station.url;
      audioRef.current.volume = settings.radioVolume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
        setHasError(true);
      });
    } else {
      const audio = new Audio(station.url);
      audio.volume = settings.radioVolume;
      audioRef.current = audio;
      audio.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
        setHasError(true);
      });
    }

    onSettingsChange({ lastStationId: station.id });
  }, [settings.radioVolume, onSettingsChange]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentStation) {
      if (currentStation) playStation(currentStation);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setHasError(true));
      setIsPlaying(true);
    }
  }, [isPlaying, currentStation, playStation]);

  const nextStation = useCallback(() => {
    if (stations.length === 0) return;
    const nextIdx = (currentStationIndex + 1) % stations.length;
    playStation(stations[nextIdx]);
  }, [stations, currentStationIndex, playStation]);

  const prevStation = useCallback(() => {
    if (stations.length === 0) return;
    const prevIdx = (currentStationIndex - 1 + stations.length) % stations.length;
    playStation(stations[prevIdx]);
  }, [stations, currentStationIndex, playStation]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number.parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.volume = vol;
    onSettingsChange({ radioVolume: vol });
  }, [onSettingsChange]);

  const volume = settings.radioVolume;

  if (stations.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0 px-1">
        <VolumeXIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('bottomBar.radio.noStations')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0 px-1">
      <button
        onClick={prevStation}
        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label={t('bottomBar.radio.prevStation')}
      >
        <SkipBackIcon className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="p-1 text-gray-700 hover:text-emerald-600 dark:text-gray-200 dark:hover:text-emerald-400 transition-colors"
        aria-label={isPlaying ? t('bottomBar.radio.pause') : t('bottomBar.radio.play')}
      >
        {(() => {
          if (isLoading) return <Loader2Icon className="h-4 w-4 animate-spin" />;
          if (hasError) return <VolumeXIcon className="h-4 w-4 text-red-400" />;
          if (isPlaying) return <PauseIcon className="h-4 w-4" />;
          return <PlayIcon className="h-4 w-4" />;
        })()}
      </button>

      <button
        onClick={nextStation}
        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label={t('bottomBar.radio.nextStation')}
      >
        <SkipForwardIcon className="h-3.5 w-3.5" />
      </button>

      <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[80px] sm:max-w-[120px]">
        {currentStation?.name ?? t('bottomBar.radio.selectStation')}
      </span>

      <div className="relative hidden sm:block">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={t('bottomBar.radio.volume')}
        >
          {volume === 0 ? <VolumeXIcon className="h-3 w-3" /> : <Volume2Icon className="h-3 w-3" />}
        </button>
        {showVolume && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-emerald-500"
              aria-label={t('bottomBar.radio.volume')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
