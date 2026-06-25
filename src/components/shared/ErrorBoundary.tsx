'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { useTranslation } from 'react-i18next';

function ErrorBoundaryFallback({ onReset }: Readonly<{ onReset: () => void }>) {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {t('errors.componentBoundaryTitle', 'Something went wrong')}
      </h2>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
        {t('errors.componentBoundaryDescription', 'An unexpected error occurred. The rest of the page is still available.')}
      </p>
      <button
        onClick={onReset}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        {t('actions.tryAgain', 'Try again')}
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const name = this.props.componentName ?? 'ErrorBoundary';
    console.error(`[${name}] Render error caught:`, error, errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorBoundaryFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
