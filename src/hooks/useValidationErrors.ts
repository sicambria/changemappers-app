import { useState, useCallback } from 'react';

export interface ValidationErrors {
  form: string | null;
  fields: Record<string, string>;
}

export interface ServerActionResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
}

export function useValidationErrors() {
  const [errors, setErrorsState] = useState<ValidationErrors>({
    form: null,
    fields: {},
  });

  const setErrors = useCallback((result: ServerActionResult) => {
    if (result.success) {
      setErrorsState({ form: null, fields: {} });
      return;
    }

    const formError = result.error || null;
    const fieldErrors: Record<string, string> = {};

    if (result.errors) {
      for (const [field, messages] of Object.entries(result.errors)) {
        if (messages && messages.length > 0) {
          fieldErrors[field] = messages[0];
        }
      }
    }

    setErrorsState({ form: formError, fields: fieldErrors });
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({ form: null, fields: {} });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrorsState((prev) => {
      const { [fieldName]: _, ...rest } = prev.fields;
      return { ...prev, fields: rest };
    });
  }, []);

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return errors.fields[fieldName];
    },
    [errors.fields]
  );

  const hasErrors = errors.form !== null || Object.keys(errors.fields).length > 0;

  return {
    errors,
    setErrors,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasErrors,
    formError: errors.form,
  };
}
