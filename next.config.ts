import { existsSync, realpathSync } from 'node:fs';
import { parse, relative, resolve } from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";


// Note: CSP is now primarily managed via src/proxy.ts using secure nonces.
// Public tool HTML keeps standalone-tool compatibility under a CSP sandbox.

type ParsedPath = {
  root: string;
  segments: string[];
};

function parsePathForCommonAncestor(value: string): ParsedPath {
  const resolved = resolve(value);
  const { root } = parse(resolved);
  const segments = relative(root, resolved).split(/[\\/]+/).filter(Boolean);

  return { root, segments };
}

function commonAncestorPath(paths: string[]): string {
  const parsed = paths.map(parsePathForCommonAncestor);
  const [first, ...rest] = parsed;
  if (!first || rest.some((item) => item.root.toLowerCase() !== first.root.toLowerCase())) {
    return resolve(paths[0] ?? process.cwd());
  }

  const commonSegments: string[] = [];
  for (let index = 0; index < first.segments.length; index += 1) {
    const candidate = first.segments[index];
    if (rest.every((item) => item.segments[index]?.toLowerCase() === candidate.toLowerCase())) {
      commonSegments.push(candidate);
      continue;
    }
    break;
  }

  return resolve(first.root, ...commonSegments);
}

export function resolveTurbopackRootForPaths(projectRoot: string, nodeModulesRealPath: string): string {
  const normalizedProjectRoot = resolve(projectRoot);
  const normalizedNodeModulesPath = resolve(nodeModulesRealPath);
  const relativeNodeModules = relative(normalizedProjectRoot, normalizedNodeModulesPath);
  const nodeModulesInsideProject = relativeNodeModules === '' || (
    !relativeNodeModules.startsWith('..') && !parse(relativeNodeModules).root
  );

  if (nodeModulesInsideProject) {
    return normalizedProjectRoot;
  }

  return commonAncestorPath([normalizedProjectRoot, normalizedNodeModulesPath]);
}

export function resolveTurbopackRoot(projectRoot = process.cwd()): string {
  const nodeModulesPath = resolve(projectRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    return resolve(projectRoot);
  }

  return resolveTurbopackRootForPaths(projectRoot, realpathSync(nodeModulesPath));
}

const securityHeaders = [
// Content-Security-Policy is managed primarily via src/proxy.ts
// Prevent clickjacking
{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
// Stop MIME-type sniffing
{ key: 'X-Content-Type-Options', value: 'nosniff' },
// XSS protection (legacy but useful for older browsers)
{ key: 'X-XSS-Protection', value: '1; mode=block' },
// Control referrer info
{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
// Restrict browser features
{
key: 'Permissions-Policy',
value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()',
},
// Force HTTPS for 1 year — preload enables browser HSTS preload list submission
{
key: 'Strict-Transport-Security',
value: 'max-age=31536000; includeSubDomains; preload',
},
];

const nextConfig: NextConfig = {
output: 'standalone',
turbopack: {
  root: resolveTurbopackRoot(),
},
outputFileTracingIncludes: {
  '/planet': [
    './.next/server/chunks/ssr/*root-of-the-server*',
    './node_modules/@bramus/specificity/**/*',
  ],
  '/connect-nature': [
    './.next/server/chunks/ssr/*root-of-the-server*',
    './node_modules/@bramus/specificity/**/*',
  ],
},
poweredByHeader: false,
// Allow Next.js dev HMR from 127.0.0.1 (used by Playwright E2E tests)
allowedDevOrigins: ['127.0.0.1', 'localhost'],
experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
},
serverExternalPackages: ['i18next', 'react-i18next'],
images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'changemappers.org' },
      { protocol: 'https', hostname: 'www.changemappers.org' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
  },
  async headers() {
    return [
      {
        // Tool HTML is CSP-sandboxed without allow-same-origin, so browser font loads
        // from those opaque-origin documents need explicit CORS on local vendor fonts.
        source: '/tools/vendor/fonts/:font*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/tools/vendor/fontawesome/webfonts/:font*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        // Permissive CSP for standalone HTML tools that use local vendor dependencies.
        // Keep this scoped to public tool documents so App Router wrappers under /tools/* use the proxy CSP.
        source: '/tools/:tool/index.html',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'none'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob: https:",
              // /tools/* widgets are standalone HTML and do not use WebSockets;
              // keep connect-src strict (no wss:/ws: wildcards) for parity with the proxy CSP.
              "connect-src 'self' https://nominatim.openstreetmap.org https://*.ingest.sentry.io",
              "object-src 'none'",
              "base-uri 'none'",
              "form-action 'none'",
              "frame-ancestors 'self'",
              "sandbox allow-scripts allow-downloads allow-forms allow-modals allow-popups allow-top-navigation-by-user-activation",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/mentor', destination: '/growth', permanent: true },
      { source: '/mentor/:path*', destination: '/growth', permanent: true },
      { source: '/coach', destination: '/growth', permanent: true },
      { source: '/coach/:path*', destination: '/growth', permanent: true },
      { source: '/training', destination: '/growth', permanent: true },
      { source: '/training/:path*', destination: '/growth', permanent: true },
      { source: '/peer', destination: '/growth', permanent: true },
      { source: '/peer/:path*', destination: '/growth', permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "changemappers",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
