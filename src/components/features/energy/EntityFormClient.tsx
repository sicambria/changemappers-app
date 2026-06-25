'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { createEnergyEntityAction } from '@/app/actions/energy/entity';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const ENERGY_ENTITY_TYPE_KEYS = [
  { value: 'INDIVIDUAL', labelKey: 'entityType.individual' },
  { value: 'HOUSEHOLD', labelKey: 'entityType.household' },
  { value: 'WORKING_GROUP', labelKey: 'entityType.workingGroup' },
  { value: 'COMMUNITY', labelKey: 'entityType.community' },
  { value: 'INSTITUTION', labelKey: 'entityType.institution' },
  { value: 'CORPORATION', labelKey: 'entityType.corporation' },
  { value: 'NORM', labelKey: 'entityType.norm' },
  { value: 'COMMONS', labelKey: 'entityType.commons' },
  { value: 'INFRASTRUCTURE', labelKey: 'entityType.infrastructure' },
  { value: 'NARRATIVE', labelKey: 'entityType.narrative' },
  { value: 'BIOREGION', labelKey: 'entityType.bioregion' },
  { value: 'NATION', labelKey: 'entityType.nation' },
  { value: 'TREATY_BODY', labelKey: 'entityType.treatyBody' },
];

const ENERGY_SCALE_KEYS = [
  { value: 'PLANETARY_INTERNATIONAL', labelKey: 'entityForm.scale.planetary' },
  { value: 'SUPRANATIONAL_REGIONAL', labelKey: 'entityForm.scale.supranational' },
  { value: 'NATIONAL', labelKey: 'entityForm.scale.national' },
  { value: 'STATE_REGIONAL', labelKey: 'entityForm.scale.stateRegional' },
  { value: 'BIOREGIONAL', labelKey: 'entityForm.scale.bioregional' },
  { value: 'COMMUNITY', labelKey: 'entityForm.scale.community' },
  { value: 'LOCAL_GROUP', labelKey: 'entityForm.scale.localGroup' },
];

const ENERGY_STATE_KEYS = [
  { value: 'EXTRACTIVE', labelKey: 'energyState.extractive' },
  { value: 'REGENERATIVE', labelKey: 'energyState.regenerative' },
  { value: 'NEUTRAL', labelKey: 'energyState.neutral' },
  { value: 'CONTESTED', labelKey: 'energyState.contested' },
  { value: 'DEPLETED', labelKey: 'energyState.depleted' },
  { value: 'CAPTURED', labelKey: 'energyState.captured' },
];

interface EntityFormClientProps {
  canvasId: string;
  canvasTitle: string;
}

const _ENERGY_ENTITY_TYPE_VALUES = [
  'INDIVIDUAL', 'HOUSEHOLD', 'WORKING_GROUP', 'COMMUNITY', 'INSTITUTION',
  'CORPORATION', 'NORM', 'COMMONS', 'INFRASTRUCTURE', 'NARRATIVE',
  'BIOREGION', 'NATION', 'TREATY_BODY'
] as const;

const _ENERGY_SCALE_VALUES = [
  'PLANETARY_INTERNATIONAL', 'SUPRANATIONAL_REGIONAL', 'NATIONAL',
  'STATE_REGIONAL', 'BIOREGIONAL', 'COMMUNITY', 'LOCAL_GROUP'
] as const;

const _ENERGY_STATE_VALUES = [
  'EXTRACTIVE', 'REGENERATIVE', 'NEUTRAL', 'CONTESTED', 'DEPLETED', 'CAPTURED'
] as const;

export function EntityFormClient({ canvasId, canvasTitle }: Readonly<EntityFormClientProps>) {
  const router = useRouter();
  const { t } = useTranslation('energy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entityType, setEntityType] = useState('');
  const [primaryScale, setPrimaryScale] = useState('');
  const [energyState, setEnergyState] = useState('');
  const [scaleBandY, setScaleBandY] = useState('4');
  const entityRequirementsId = 'energy-entity-submit-requirements';
  const entityRequirements = [
    !entityType ? t('common:actionRequirements.selectEnergyEntityType') : null,
    !primaryScale ? t('common:actionRequirements.selectEnergyPrimaryScale') : null,
    !energyState ? t('common:actionRequirements.selectEnergyState') : null,
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await createEnergyEntityAction({
      canvasId,
      roleLabel: formData.get('roleLabel') as string,
      entityType: entityType as typeof _ENERGY_ENTITY_TYPE_VALUES[number],
      primaryScale: primaryScale as typeof _ENERGY_SCALE_VALUES[number],
      energyState: energyState as typeof _ENERGY_STATE_VALUES[number],
      scaleBandY: Number.parseInt(scaleBandY),
      visibility: 'VISIBLE',
      energyMagnitude: 'MEDIUM',
      energyRate: 'CHRONIC',
      internalPower: 'DISTRIBUTED',
      voiceAccess: 'FULL',
      boundaryPermeability: 'SEMI_PERMEABLE',
      selfDetermination: 'PRESENT',
      numericValue: formData.get('numericValue') ? Number.parseFloat(formData.get('numericValue') as string) : undefined,
      numericUnit: formData.get('numericUnit') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    });

    if (result.success && result.data) {
      router.push(`/energy/${canvasId}`);
    } else {
      setIsSubmitting(false);
      toast.error('error' in result ? result.error : t('entityForm.createFailed'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('entityForm.addEntityTo', { title: canvasTitle })}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          {t('entityForm.privacyNote')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="roleLabel">{t('entityForm.roleLabel')} *</Label>
          <Input
            id="roleLabel"
            name="roleLabel"
            placeholder={t('entityForm.roleLabelPlaceholder')}
              required
              minLength={2}
              maxLength={200}
            />
        <p className="text-xs text-muted-foreground">
          {t('entityForm.roleLabelHint')}
        </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('entityForm.entityType')} *</Label>
          <Select onValueChange={setEntityType} defaultValue={entityType}>
            <SelectTrigger>
              <SelectValue placeholder={t('entityForm.selectType')} />
            </SelectTrigger>
            <SelectContent>
              {ENERGY_ENTITY_TYPE_KEYS.map((et) => (
                <SelectItem key={et.value} value={et.value}>
                  {t(et.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

        <div className="space-y-2">
          <Label>{t('entityForm.primaryScale')} *</Label>
          <Select onValueChange={setPrimaryScale} defaultValue={primaryScale}>
            <SelectTrigger>
              <SelectValue placeholder={t('entityForm.selectScale')} />
            </SelectTrigger>
            <SelectContent>
              {ENERGY_SCALE_KEYS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {t(s.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('entityForm.energyState')} *</Label>
          <Select onValueChange={setEnergyState} defaultValue={energyState}>
            <SelectTrigger>
              <SelectValue placeholder={t('entityForm.selectState')} />
            </SelectTrigger>
            <SelectContent>
              {ENERGY_STATE_KEYS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {t(s.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

        <div className="space-y-2">
          <Label>{t('entityForm.scaleBand')}</Label>
          <Select onValueChange={setScaleBandY} defaultValue={scaleBandY}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENERGY_SCALE_KEYS.map((s, i) => (
                <SelectItem key={s.value} value={(i + 1).toString()}>
                  {i + 1} — {t(s.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('entityForm.numericValue')}</Label>
          <Input
            name="numericValue"
            type="number"
            step="0.01"
            placeholder={t('entityForm.numericValuePlaceholder')}
              />
            </div>
        <div className="space-y-2">
          <Label>{t('entityForm.unit')}</Label>
          <Input
            name="numericUnit"
            placeholder={t('entityForm.unitPlaceholder')}
                maxLength={50}
              />
            </div>
          </div>

          <div className="space-y-2">
        <Label htmlFor="notes">{t('entityForm.notes')}</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder={t('entityForm.notesPlaceholder')}
              maxLength={2000}
              rows={3}
            />
          </div>

          <ActionRequirements id={entityRequirementsId} requirements={entityRequirements} />

          <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting || !entityType || !primaryScale || !energyState} disabledReasonId={entityRequirements.some(Boolean) ? entityRequirementsId : undefined}>
          {isSubmitting ? t('entityForm.adding') : t('entityForm.addEntity')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/energy/${canvasId}`)}>
          {t('entityForm.cancel')}
        </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
