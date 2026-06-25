'use client';

import SegmentErrorFallback from '@/components/shared/SegmentErrorFallback';

export default function SegmentError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return <SegmentErrorFallback error={error} reset={reset} />;
}
