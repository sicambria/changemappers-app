'use client';

import { LabelKeyCombobox } from './LabelKeyCombobox';

export interface TargetAudienceOption {
  id: string;
  labelKey: string;
}

export const TARGET_AUDIENCE_OPTIONS: TargetAudienceOption[] = [
  { id: 'INDIVIDUALS', labelKey: 'targetAudience.INDIVIDUALS' },
  { id: 'COMMUNITIES', labelKey: 'targetAudience.COMMUNITIES' },
  { id: 'NGOS', labelKey: 'targetAudience.NGOS' },
  { id: 'SCHOOLS', labelKey: 'targetAudience.SCHOOLS' },
  { id: 'PUBLIC_INSTITUTIONS', labelKey: 'targetAudience.PUBLIC_INSTITUTIONS' },
  { id: 'BUSINESSES', labelKey: 'targetAudience.BUSINESSES' },
  { id: 'POLICYMAKERS', labelKey: 'targetAudience.POLICYMAKERS' },
  { id: 'RESEARCHERS', labelKey: 'targetAudience.RESEARCHERS' },
  { id: 'OTHER', labelKey: 'targetAudience.OTHER' },
];

interface TargetAudienceComboboxProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
}

export function TargetAudienceCombobox(props: Readonly<TargetAudienceComboboxProps>) {
  return (
    <LabelKeyCombobox
      {...props}
      options={TARGET_AUDIENCE_OPTIONS}
      fieldLabelKey="offer.targetAudience"
      fieldLabelDefault="Target Audience"
      placeholderKey="form.targetAudiencePlaceholder"
    />
  );
}
