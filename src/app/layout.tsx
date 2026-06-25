import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { createSocialMetadata } from '@/lib/metadata/social';
import { getLocale } from '@/lib/get-locale';
import { getFeedbackConfig } from '@/lib/site-config';
import { getCurrentUser } from "@/app/actions/auth";
import { getMetadataTranslations } from '@/lib/server-i18n';

type RootMetadataTranslations = {
  rootMetadata: {
    description: string;
    keywords: string[];
    openGraphLocale: string;
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const { translations } = await getMetadataTranslations('common');
  const localized = (translations as RootMetadataTranslations).rootMetadata;
  const socialMetadata = createSocialMetadata({
    title: 'Changemappers',
    description: localized.description,
    path: '/',
    type: 'website',
  });

  return {
    ...socialMetadata,
    keywords: localized.keywords,
    authors: [{ name: "Changemappers" }],
    openGraph: {
      ...socialMetadata.openGraph,
      locale: localized.openGraphLocale,
    },
  };
}

import { AppHydratedMarker } from "@/components/utils/AppHydratedMarker";

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Parallel: the user lookup inside getLocale() and getCurrentUser() dedupes
  // via React cache() on getCurrentUserData (AUDIT-20260613-013).
  const [initialLanguage, userRes, feedbackConfig] = await Promise.all([
    getLocale(),
    getCurrentUser(),
    getFeedbackConfig(),
  ]);
  const initialUser = userRes.success && userRes.data ? userRes.data.user : null;
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang={initialLanguage} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* SAFE: value is JSON.stringify of a controlled SupportedLanguage string */}
        <script
          id="initial-language"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL_LANGUAGE__ = ${JSON.stringify(initialLanguage)};`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-950" suppressHydrationWarning>
        <AppHydratedMarker />
        <ClientLayout initialLanguage={initialLanguage} initialUser={initialUser} feedbackConfig={feedbackConfig}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
