'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';
import { toggleKillSwitchAction } from '@/actions/admin/toggle-kill-switch';
import { useTranslation } from 'react-i18next';
import type { SystemKillSwitch } from '@/lib/prisma-shared';
import type { KillSwitchFeature } from '@/lib/security/kill-switch';

interface Props {
  initialSwitches: SystemKillSwitch;
}

/**
 * Client component for managing global feature kill switches.
 * Provides a UI to toggle risky features with mandatory reasoning validation.
 */
export function SecurityControlCenter({ initialSwitches }: Readonly<Props>) {
  const { t } = useTranslation('admin');
  const [switches, setSwitches] = useState(initialSwitches);
  const [pendingFeature, setPendingFeature] = useState<KillSwitchFeature | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const features: { id: KillSwitchFeature; risk: 'High' | 'Medium' | 'Low' }[] = [
    { id: 'activityPubEnabled', risk: 'High' },
    { id: 'lanDiscoveryEnabled', risk: 'High' },
    { id: 'userRegistrationEnabled', risk: 'Medium' },
    { id: 'externalExportsEnabled', risk: 'Medium' },
    { id: 'rssFetchingEnabled', risk: 'Medium' },
  ];

  const getFeatureLabel = (featureId: KillSwitchFeature) => t(`security.features.${featureId}.label`);
  const getActionLabel = (enabled: boolean) => (enabled ? t('security.disable') : t('security.enable'));

  const handleToggleClick = (featureId: KillSwitchFeature) => {
    if (pendingFeature === featureId) {
      setPendingFeature(null);
    } else {
      setPendingFeature(featureId);
      setReasoning('');
    }
  };

  const handleConfirmToggle = async () => {
    if (!pendingFeature) return;

    if (reasoning.trim().length < 20) {
      toast.error(t('security.minCharsError'));
      return;
    }

    setIsSubmitting(true);
    const newState = !switches[pendingFeature];

    try {
      const result = await toggleKillSwitchAction(pendingFeature, newState, reasoning);
      if (result.success) {
        setSwitches((prev) => ({ ...prev, [pendingFeature]: newState }));
        setPendingFeature(null);
        toast.success(t('security.success', { state: newState ? t('security.stateOn') : t('security.stateOff') }));
      } else {
        toast.error(t(result.error || 'security.error'));
      }
    } catch (error) {
      toast.error(t('security.unexpectedError'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => {
          const enabled = Boolean(switches[feature.id]);
          const featureLabel = getFeatureLabel(feature.id);
          const stateLabel = enabled ? t('security.stateOn') : t('security.stateOff');

          return (
            <Card
              key={feature.id}
              data-testid="security-feature-card"
              className={`min-w-0 transition-all ${!enabled ? 'border-red-500 bg-red-50/30' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <CardTitle className="min-w-0 text-lg leading-tight">{featureLabel}</CardTitle>
                  <div
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      feature.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {t('security.risks.label', { risk: t(`security.risks.${feature.risk.toLowerCase()}`) })}
                  </div>
                </div>
                <CardDescription className="text-xs">{t(`security.features.${feature.id}.description`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  data-testid="security-feature-state-row"
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      }`}
                    />
                    <span className="min-w-0 text-sm font-semibold">
                      {enabled ? t('security.operational') : t('security.disabled')}
                    </span>
                  </div>
                  <Button
                    variant={enabled ? 'danger' : 'primary'}
                    size="sm"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${featureLabel}: ${stateLabel}`}
                    onClick={() => handleToggleClick(feature.id)}
                    disabled={isSubmitting}
                    className={`w-[136px] shrink-0 overflow-hidden px-2 font-bold ${
                      enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <span className="inline-flex w-full items-center justify-between gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-black tracking-wide ${
                          enabled ? 'bg-white text-green-700' : 'bg-white text-gray-700'
                        }`}
                      >
                        {stateLabel}
                      </span>
                      <span className="truncate text-xs">{getActionLabel(enabled)}</span>
                    </span>
                  </Button>
                </div>

                {pendingFeature === feature.id && (
                  <div className="mt-4 animate-in space-y-4 rounded-lg border bg-background p-4 shadow-inner duration-200 fade-in zoom-in-95">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {t('security.mandatoryReasoning', { action: getActionLabel(enabled) })}
                    </div>
                    <Textarea
                      placeholder={t('security.reasoningPlaceholder')}
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      className="min-h-[100px] resize-none text-sm focus-visible:ring-primary"
                      autoFocus
                    />
                    <ActionRequirements id={`security-reasoning-requirements-${feature.id}`} requirements={[reasoning.trim().length < 20 ? t('common:actionRequirements.enterReasoningMin', { count: 20 }) : null]} />
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${reasoning.length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                        {t('security.charsMin', { count: reasoning.length })}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setPendingFeature(null)} disabled={isSubmitting}>
                          {t('common:actions.cancel')}
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs font-bold"
                          onClick={handleConfirmToggle}
                          disabled={reasoning.trim().length < 20 || isSubmitting}
                          disabledReasonId={reasoning.trim().length < 20 ? `security-reasoning-requirements-${feature.id}` : undefined}
                        >
                          {isSubmitting ? t('security.updating') : t('security.commitChange')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
