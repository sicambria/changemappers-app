'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';
import {
  FlaskConicalIcon,
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
} from 'lucide-react';
import {
  getExperimentalFeaturesAction,
  toggleGlobalFeatureAction,
  setOptInDefaultAction,
  createExperimentalFeatureAction,
  deleteExperimentalFeatureAction,
} from '@/app/actions/admin/experimental-features';
import type { ExperimentalFeature } from '@/lib/prisma-shared';

export function AdminExperimentalFeaturesTab() {
  const { t } = useTranslation('admin');
  const [features, setFeatures] = useState<ExperimentalFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    const result = await getExperimentalFeaturesAction();
    if (result.success && result.data) {
      setFeatures(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleToggleGlobal = async (slug: string, enabled: boolean) => {
    setSavingId(slug);
    const result = await toggleGlobalFeatureAction(slug, enabled);
    if (result.success) {
      setFeatures((prev) =>
        prev.map((f) => (f.slug === slug ? { ...f, globallyEnabled: enabled } : f)),
      );
      toast.success(t('experimental.saved'));
    } else {
      toast.error(t('experimental.error'));
    }
    setSavingId(null);
  };

  const handleSetOptIn = async (slug: string, optInByDefault: boolean) => {
    setSavingId(slug);
    const result = await setOptInDefaultAction(slug, optInByDefault);
    if (result.success) {
      setFeatures((prev) =>
        prev.map((f) => (f.slug === slug ? { ...f, optInByDefault } : f)),
      );
      toast.success(t('experimental.saved'));
    } else {
      toast.error(t('experimental.error'));
    }
    setSavingId(null);
  };

  const handleCreate = async () => {
    if (!newSlug.trim() || !newLabel.trim()) return;
    const result = await createExperimentalFeatureAction(newSlug.trim(), newLabel.trim(), newDescription.trim() || undefined);
    if (result.success) {
      toast.success(t('experimental.createSuccess'));
      setShowAddForm(false);
      setNewSlug('');
      setNewLabel('');
      setNewDescription('');
      fetchFeatures();
    } else {
      toast.error(t('experimental.createError'));
    }
  };

  const handleDelete = async (slug: string) => {
    if (!globalThis.confirm(t('experimental.deleteConfirm'))) return;
    const result = await deleteExperimentalFeatureAction(slug);
    if (result.success) {
      toast.success(t('experimental.deleteSuccess'));
      setFeatures((prev) => prev.filter((f) => f.slug !== slug));
    } else {
      toast.error(t('experimental.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('experimental.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('experimental.description')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t('experimental.addFeature')}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-dashed border-purple-300">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder={t('experimental.slugPlaceholder')}
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              label={t('experimental.slugLabel')}
            />
            <Input
              placeholder={t('experimental.labelLabel')}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              label={t('experimental.labelLabel')}
            />
            <Textarea
              placeholder={t('experimental.descriptionLabel')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                {t('common:actions.cancel')}
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!newSlug.trim() || !newLabel.trim()}>
                {t('experimental.addFeature')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {features.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FlaskConicalIcon className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p className="text-sm">{t('experimental.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const isSaving = savingId === feature.slug;
            return (
              <Card key={feature.id} className="min-w-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{feature.label}</CardTitle>
                      {feature.description && (
                        <CardDescription className="text-xs mt-1">{feature.description}</CardDescription>
                      )}
                      <code className="mt-1 inline-block text-[10px] text-muted-foreground bg-muted px-1 rounded">
                        {feature.slug}
                      </code>
                    </div>
                    <button
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                      onClick={() => handleDelete(feature.slug)}
                      disabled={isSaving}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('experimental.globallyEnabled')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${feature.globallyEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {feature.globallyEnabled ? t('experimental.globallyEnabled') : t('experimental.globallyDisabled')}
                      </span>
                      <button
                        role="switch"
                        aria-checked={feature.globallyEnabled}
                        onClick={() => handleToggleGlobal(feature.slug, !feature.globallyEnabled)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-50 ${feature.globallyEnabled ? 'bg-purple-500' : 'bg-muted-foreground/30'}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${feature.globallyEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('experimental.optIn')} / {t('experimental.optOut')}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSetOptIn(feature.slug, true)}
                        disabled={isSaving || feature.optInByDefault}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${feature.optInByDefault ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >
                        {t('experimental.optIn')}
                      </button>
                      <button
                        onClick={() => handleSetOptIn(feature.slug, false)}
                        disabled={isSaving || !feature.optInByDefault}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${feature.optInByDefault ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}
                      >
                        {t('experimental.optOut')}
                      </button>
                    </div>
                  </div>

                  {feature.optInByDefault ? (
                    <p className="text-[10px] text-muted-foreground">{t('experimental.optInDesc')}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">{t('experimental.optOutDesc')}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
