'use client';

import { LabelKeyCombobox } from './LabelKeyCombobox';

export interface ImpactTypeOption {
  id: string;
  labelKey: string;
}

export const IMPACT_TYPE_OPTIONS: ImpactTypeOption[] = [
  { id: 'DIRECT_SERVICE', labelKey: 'impactType.DIRECT_SERVICE' },
  { id: 'CAPACITY_BUILDING', labelKey: 'impactType.CAPACITY_BUILDING' },
  { id: 'SYSTEMIC_CHANGE', labelKey: 'impactType.SYSTEMIC_CHANGE' },
  { id: 'AWARENESS_RAISING', labelKey: 'impactType.AWARENESS_RAISING' },
  { id: 'RESEARCH_DOCUMENTATION', labelKey: 'impactType.RESEARCH_DOCUMENTATION' },
  { id: 'NETWORK_BUILDING', labelKey: 'impactType.NETWORK_BUILDING' },
  { id: 'POLICY_INFLUENCE', labelKey: 'impactType.POLICY_INFLUENCE' },
  { id: 'RESOURCE_CREATION', labelKey: 'impactType.RESOURCE_CREATION' },
  { id: 'OTHER', labelKey: 'impactType.OTHER' },
];

interface ImpactTypeComboboxProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
}

export function ImpactTypeCombobox(props: Readonly<ImpactTypeComboboxProps>) {
  return (
    <LabelKeyCombobox
      {...props}
      options={IMPACT_TYPE_OPTIONS}
      fieldLabelKey="offer.impactType"
      fieldLabelDefault="Impact Type"
      placeholderKey="form.impactTypePlaceholder"
    />
  );
}
