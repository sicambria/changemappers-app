'use client';

import { useTranslation } from 'react-i18next';
import { CheckIcon, XIcon } from 'lucide-react';

interface PasswordRequirement {
label: string;
met: boolean;
}

interface PasswordStrengthIndicatorProps {
password: string;
className?: string;
}

export function PasswordStrengthIndicator({
password,
className = ''
}: Readonly<PasswordStrengthIndicatorProps>) {
const { t } = useTranslation('validation');

const requirements: PasswordRequirement[] = [
  { label: t('password.minLength'), met: password.length >= 12 },
  { label: t('password.uppercase'), met: /[A-Z]/.test(password) },
  { label: t('password.lowercase'), met: /[a-z]/.test(password) },
  { label: t('password.number'), met: /\d/.test(password) },
  { label: t('password.special'), met: /[^A-Za-z0-9]/.test(password) },
];

  return (
    <div className={`space-y-1 mt-2 ${className}`}>
      {requirements.map((req) => (
        <div key={req.label} className="flex items-center gap-2 text-xs">
          {req.met ? (
        <CheckIcon className="h-3 w-3 text-emerald-500" />
      ) : (
        <XIcon className="h-3 w-3 text-gray-300" />
      )}
      <span className={req.met ? 'text-emerald-600' : 'text-gray-400'}>
        {req.label}
      </span>
        </div>
      ))}
    </div>
  );
}
