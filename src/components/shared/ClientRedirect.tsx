'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ClientRedirectProps = {
  href: string;
  message?: string;
};

export default function ClientRedirect({
  href,
  message = 'Redirecting…',
}: Readonly<ClientRedirectProps>) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
