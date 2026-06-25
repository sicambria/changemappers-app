import { useState, useCallback, useMemo } from 'react';

export type ValidationType = 'minLength' | 'maxLength' | 'email' | 'url' | 'pattern' | 'required' | 'custom';

export interface ValidationRule {
  type: ValidationType;
  value?: number | RegExp | string;
  message: string;
  validate?: (value: string) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  touched: boolean;
}

export function useFieldValidation(rules: ValidationRule[]) {
  const [touched, setTouched] = useState(false);

  const stableRules = useMemo(() => rules, [rules]);

  const validate = useCallback((val: string): ValidationResult => {
    const errors: string[] = [];

    for (const rule of stableRules) {
      let isValid = true;

      switch (rule.type) {
        case 'required':
          isValid = val.trim().length > 0;
          break;
        case 'minLength':
          isValid = val.length >= (rule.value as number);
          break;
        case 'maxLength':
          isValid = val.length <= (rule.value as number);
          break;
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          break;
        case 'url':
          try {
            if (val.trim()) new URL(val);
            // isValid stays true (initialised above) for empty or valid URLs
          } catch {
            isValid = val.trim() === '';
          }
          break;
        case 'pattern':
          isValid = (rule.value as RegExp).test(val);
          break;
        case 'custom':
          isValid = rule.validate ? rule.validate(val) : true;
          break;
      }

      if (!isValid && val.length > 0) {
        errors.push(rule.message);
      }
    }

    return { isValid: errors.length === 0, errors, touched };
  }, [stableRules, touched]);

  return { validate, touched, setTouched };
}
