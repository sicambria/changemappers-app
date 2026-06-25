'use client';

import { forwardRef, useState, useEffect, ReactNode } from 'react';
import { Input, InputProps } from './Input';
import { ValidationRule, useFieldValidation } from '@/hooks/useFieldValidation';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';

export interface ValidatedInputProps extends Omit<InputProps, 'error'> {
  rules?: ValidationRule[];
  showTooltip?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  tooltipContent?: ReactNode;
  error?: string;
}

/**
 * ValidationHint renders rule messages inline below the input, expanding downward.
 * This avoids z-index overlap with adjacent form fields (as opposed to the old
 * floating tooltip that appeared above and covered sibling inputs).
 */
function ValidationHint({
  children,
  visible,
  content,
}: Readonly<{
  children: ReactNode;
  visible: boolean;
  content: ReactNode;
}>) {
  return (
    <div className="w-full">
      {children}
      {visible && (
        <div className="mt-1 px-3 py-2 text-xs text-white bg-slate-800 rounded shadow-md pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ rules = [], showTooltip = true, onValidationChange, className, tooltipContent, error: externalError, defaultValue, ...props }, ref) => {
    const isControlled = props.value !== undefined;
    const [internalValue, setInternalValue] = useState((defaultValue as string) || '');
    const [isFocused, setIsFocused] = useState(false);
    const { validate, touched, setTouched } = useFieldValidation(rules);
    const value = isControlled ? (props.value as string) : internalValue;

    const result = validate(value);

    useEffect(() => {
      onValidationChange?.(result.isValid);
    }, [result.isValid, onValidationChange]);

    useEffect(() => {
      if (isControlled) {
        setInternalValue((props.value as string) || '');
      }
    }, [isControlled, props.value]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      props.onChange?.(e);
    };

    const showValidation = touched && value.length > 0;
    const showHint = showTooltip && isFocused && !result.isValid && rules.length > 0;
    const hintBody = tooltipContent ?? (
      <ul className="space-y-1">
        {rules.map((r) => (
          <li key={r.message}>{r.message}</li>
        ))}
      </ul>
    );

    const displayError = externalError || (showValidation && !result.isValid ? result.errors[0] : undefined);

    return (
      <ValidationHint visible={showHint} content={hintBody}>
        <div className="relative w-full">
          <Input
            ref={ref}
            {...props}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            error={displayError}
            className={className}
          />
          {showValidation && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {result.isValid ? (
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-red-500" />
              )}
            </span>
          )}
        </div>
      </ValidationHint>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';
