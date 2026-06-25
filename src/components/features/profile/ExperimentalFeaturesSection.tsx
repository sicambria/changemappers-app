'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlaskConicalIcon, SlidersIcon, Loader2Icon } from 'lucide-react';
import {
  getMyExperimentalFeaturesAction,
  updateExperimentalFeatureOverridesAction,
} from '@/app/actions/experimental-features';
import type { ExperimentalFeatureWithUserState } from '@/app/actions/experimental-features';

export function ExperimentalFeaturesSection() {
  const { t } = useTranslation('profiles');
  const [features, setFeatures] = useState<ExperimentalFeatureWithUserState[]>([]);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getMyExperimentalFeaturesAction().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setFeatures(result.data);
        const ov: Record<string, boolean> = {};
        for (const f of result.data) {
          ov[f.slug] = f.effectiveEnabled;
        }
        setOverrides(ov);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (slug: string) => {
    setOverrides((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const handleSave = async () => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const result = await updateExperimentalFeatureOverridesAction(overrides);
      if (!isMountedRef.current) return;

      if (!result.success) {
        setError(result.error || t('profile.page.experimentalFeaturesError'));
        return;
      }

      setSaved(true);
      savedTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSaved(false);
        }
      }, 2000);
    } catch {
      if (isMountedRef.current) {
        setError(t('profile.page.experimentalFeaturesError'));
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (features.length === 0) {
    return null;
  }

  return (
    <section id="experimental-features" className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConicalIcon className="h-4 w-4 text-purple-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('profile.page.experimentalFeaturesTitle')}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersIcon className="h-4 w-4 text-purple-500" />
            {t('profile.page.experimentalFeaturesTitle')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('profile.page.experimentalFeaturesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature) => {
            const isEnabled = overrides[feature.slug] ?? false;
            const defaultMode = feature.optInByDefault
              ? t('profile.page.experimentalFeatureOptIn')
              : t('profile.page.experimentalFeatureOptOut');

            return (
              <div
                key={feature.slug}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FlaskConicalIcon className="h-4 w-4 shrink-0 text-purple-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{feature.label}</p>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                    )}
                    <span className="text-[10px] text-muted-foreground">{defaultMode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium ${isEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {isEnabled ? t('profile.page.routeEnabled') : t('profile.page.routeDisabled')}
                  </span>
                  <div
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={feature.label}
                    onClick={() => handleToggle(feature.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle(feature.slug);
                      }
                    }}
                    tabIndex={0}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${isEnabled ? 'bg-purple-500' : 'bg-muted-foreground/30'}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${isEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-3 flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? t('profile.page.savingLabel') : t('profile.page.saveSettings')}
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 font-medium">
                {t('profile.page.savedConfirmation')}
              </span>
            )}
            {error && (
              <span role="alert" className="text-sm text-destructive font-medium">{error}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
