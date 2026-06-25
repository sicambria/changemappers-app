'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OpenApiSpec {
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: Record<string, Record<string, {
    summary: string;
    description: string;
    responses: Record<string, {
      description: string;
    }>;
  }>>;
}

export default function ApiDocsPage() {
  const { t } = useTranslation('common');
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/openapi.json')
      .then((res) => res.json())
      .then((data: OpenApiSpec) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load OpenAPI spec:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <h1 className="text-2xl font-bold text-stone-900">{t('apiDocs.notFoundTitle')}</h1>
        <p className="mt-2 text-stone-600">{t('apiDocs.notFoundBody')}</p>
        <Link href="/" className="mt-6 text-emerald-600 hover:underline">{t('apiDocs.returnHome')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-full p-2 text-stone-500 hover:bg-stone-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">{t('apiDocs.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">v{spec.info.version}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Sidebar / Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-stone-900">{spec.info.title}</h2>
                <p className="mt-4 text-lg leading-8 text-stone-600">
                  {spec.info.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-md bg-white p-2 shadow-sm">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('apiDocs.securityTitle')}</h3>
                    <p className="text-sm text-stone-500">{t('apiDocs.securityBody')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-md bg-white p-2 shadow-sm">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('apiDocs.performanceTitle')}</h3>
                    <p className="text-sm text-stone-500">{t('apiDocs.performanceBody')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paths */}
          <div className="lg:col-span-2">
            <div className="space-y-12">
              {Object.entries(spec.paths).map(([path, methods]) => (
                <section key={path} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  {Object.entries(methods).map(([method, details]) => (
                    <div key={method} className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider ${(() => {
                            if (method === 'get') return 'bg-blue-100 text-blue-700';
                            if (method === 'post') return 'bg-green-100 text-green-700';
                            return 'bg-stone-100 text-stone-700';
                          })()}`}>
                            {method}
                          </span>
                          <code className="text-lg font-mono font-medium text-stone-800">{path}</code>
                        </div>
                      </div>
                      
                      <h4 className="mt-4 text-xl font-semibold">{details.summary}</h4>
                      <p className="mt-2 text-stone-600">{details.description}</p>

                      <div className="mt-6">
                        <h5 className="text-sm font-semibold uppercase tracking-wider text-stone-500">{t('apiDocs.responses')}</h5>
                        <div className="mt-3 space-y-3">
                          {Object.entries(details.responses).map(([code, response]) => (
                            <div key={code} className="flex items-start gap-4 rounded-xl bg-stone-50 p-4">
                              <span className={`mt-0.5 text-sm font-bold ${
                                code.startsWith('2') ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {code}
                              </span>
                              <p className="text-sm text-stone-700">{response.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
