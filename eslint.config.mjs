import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Inline ESLint plugin: enforces `'use server';` as the very first statement
 * in every file under src/app/actions/.
 *
 * Without this directive, Next.js/Turbopack may bundle the file for the client,
 * stubbing server-only modules (Prisma, next/headers, etc.) as empty objects.
 * This causes silent runtime errors like `Cannot read properties of undefined
 * (reading 'findMany')` that TypeScript will NOT catch.
 */
const requireUseServerPlugin = {
  rules: {
    "require-use-server": {
      meta: { type: "problem", messages: { missing: "Action files must have 'use server'; as the very first line (before all imports). Without it, Prisma and other server-only modules are silently stubbed as empty objects in the client bundle." } },
      create(context) {
        return {
          Program(node) {
            const first = node.body[0];
            if (first?.type === "ExpressionStatement" && first.directive === "use server") return;
            context.report({ node: first ?? node, messageId: "missing" });
          },
        };
      },
    },
  },
};

const clientBoundaryPlugin = {
  rules: {
    "no-server-prisma-in-client": {
      meta: {
        type: "problem",
        messages: {
          blocked:
            "Client files must not import '@/lib/prisma'. Import enums/types from '@/lib/prisma-shared' instead to keep Node-only Prisma code out of browser bundles.",
        },
      },
      create(context) {
        let isClientFile = false;

        return {
          Program(node) {
            const first = node.body[0];
            isClientFile = first?.type === "ExpressionStatement" && first.directive === "use client";
          },
          ImportDeclaration(node) {
            if (!isClientFile) return;
            if (node.source.value === "@/lib/prisma") {
              context.report({ node, messageId: "blocked" });
            }
          },
        };
      },
    },
  },
};

/**
 * Security ESLint plugin: Shift-left security rules to catch vulnerabilities
 * at development time before they reach production.
 */
const securityPlugin = {
  rules: {
    "no-stack-trace-return": {
      meta: {
        type: "problem",
        docs: { description: "Prevent stack traces from being returned to clients" },
        messages: { stackTrace: "Returning error.stack to client leaks sensitive implementation details. Use a generic error message instead." },
      },
      create(context) {
        return {
          ReturnStatement(node) {
            const sourceCode = context.sourceCode || context.getSourceCode();
            const text = sourceCode.getText(node);
            if (/\berror\.stack\b/.test(text) || /\be\.stack\b/.test(text)) {
              context.report({ node, messageId: "stackTrace" });
            }
          },
        };
      },
    },
    "require-sanitize-html-comment": {
      meta: {
        type: "problem",
        docs: { description: "Require safety comment when using dangerouslySetInnerHTML" },
        messages: { missingComment: "dangerouslySetInnerHTML requires a safety comment explaining why content is sanitized. Add: // SAFE: Content sanitized with sanitize-html before DB write" },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name === "dangerouslySetInnerHTML") {
              const sourceCode = context.sourceCode || context.getSourceCode();
              const lines = sourceCode.getText().split('\n');
              const nodeLine = node.loc.start.line;
              const contextLines = lines.slice(Math.max(0, nodeLine - 10), nodeLine + 1).join('\n');
              if (!/\/\/\s*SAFE:/.test(contextLines) && !/\/\*\s*SAFE:/.test(contextLines)) {
                context.report({ node, messageId: "missingComment" });
              }
            }
          },
        };
      },
    },
"no-queryRawUnsafe-without-comment": {
meta: {
type: "problem",
docs: { description: "Require documented reason for $queryRawUnsafe usage" },
messages: { missingComment: "$queryRawUnsafe requires a comment explaining why it's safe (e.g., // SAFE: Static query, no user input)" },
},
create(context) {
return {
CallExpression(node) {
const sourceCode = context.sourceCode || context.getSourceCode();
const text = sourceCode.getText(node);
if (/\.\$queryRawUnsafe\s*\(/u.test(text)) {
const lines = sourceCode.getText().split('\n');
const nodeLine = node.loc.start.line;
const contextLines = lines.slice(Math.max(0, nodeLine - 3), nodeLine + 1).join('\n');
if (!/\/\/\s*SAFE:/.test(contextLines) && !/\/\*\s*SAFE:/.test(contextLines)) {
context.report({ node, messageId: "missingComment" });
}
}
},
};
},
},
"require-prisma-select": {
meta: {
type: "problem",
docs: { description: "Require explicit select/omit in Prisma findUnique/findMany/findFirst" },
messages: {
missingSelect: "Prisma findUnique/findMany/findFirst without select/omit over-fetches sensitive fields. Add select: { ... } with only required fields.",
},
},
create(context) {
      return {
        CallExpression(node) {
          const sourceCode = context.sourceCode || context.getSourceCode();
          const text = sourceCode.getText(node);
          if (!/\.find(?:Unique|Many|First)\s*\(/u.test(text)) return;
          if (/\b(?:select|omit)\s*:/u.test(text)) return;
          context.report({ node, messageId: "missingSelect" });
        },
      };
    },
},
},
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable-marker hygiene (technical-roadmap §2 gate: "disable-marker count trending
  // to a documented floor"). A disable directive that no longer suppresses anything is
  // a dead no-op that pads the disable-marker ratchet (verify-clean-code-budgets.js)
  // without buying any escape hatch. Erroring on unused directives keeps every
  // @ts-/eslint-disable load-bearing, so the ratchet count reflects real suppressions.
  // (0 unused directives across the full lint scope when enabled.)
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Never lint generated Prisma client
    "src/generated/**",
    // Never lint coverage reports
    "coverage/**",
    // Never lint generated Playwright reports and artifacts
    "playwright-report/**",
    "test-results/**",
    // Never lint SonarQube scanner artifacts. A concurrent scan transiently
    // populates .scannerwork/.sonartmp/ with multi-MB bundled .d.ts files
    // (typescript.d.ts, lib.dom.d.ts) that OOM ESLint's ~4GB heap.
    ".scannerwork/**",
// Never lint git worktree directories
".claude/worktrees/**",
".antigravity/worktrees/**",
    // Never lint vendored/minified third-party files in public/
    "public/**",
 // Never lint scratch scripts
 "scratch/**",
 // Never lint documentation
 "docs/**",
    // Never lint the generated Capacitor Android project (vendored native-bridge.js, etc.)
    "android/**",
  ]),
  // Enforce 'use server' on all action implementation files.
  // Excludes barrel/index files: they only re-export from files that already
  // have 'use server'. Adding 'use server' to a barrel causes a Next.js build
  // error ("Only async functions are allowed to be exported in a 'use server' file")
  // because export { } re-export statements are not async functions.
  {
    files: ["src/app/actions/**/*.ts"],
    ignores: ["src/app/actions/**/index.ts"],
    plugins: { "use-server": requireUseServerPlugin },
    rules: { "use-server/require-use-server": "error" },
  },
  // AUDIT-20260612-007: server actions must log through the structured Pino
  // logger (logActionError from '@/lib/action-logger' or logger from
  // '@/lib/logger'), never raw console.error/warn/log.
  {
    files: ["src/app/actions/**/*.ts"],
    ignores: ["src/app/actions/**/__tests__/**"],
    rules: { "no-console": "error" },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: { "client-boundary": clientBoundaryPlugin },
    rules: { "client-boundary/no-server-prisma-in-client": "error" },
  },
{
  plugins: { security: securityPlugin },
rules: {
"security/no-stack-trace-return": "error",
"security/require-sanitize-html-comment": "error",
"security/no-queryRawUnsafe-without-comment": "error",
"security/require-prisma-select": "error",
},
},
{
  files: ["src/lib/federation/**/*.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/lib/prisma"],
            message:
              "Shared federation modules must stay browser-safe. Import enums/types from '@/lib/prisma-shared' instead of the server Prisma wrapper.",
          },
        ],
      },
    ],
  },
},
{
  // Enforce correct Prisma import paths project-wide.
  // @prisma/client is a stub — our real client lives in src/generated/prisma.
  // All application code must import from @/lib/prisma (the re-export hub).
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@prisma/client"],
            message:
              "Do not import from '@prisma/client' — this project uses a local generated client. " +
              "Import from '@/lib/prisma' instead (enums, types, prisma instance).",
          },
          {
            group: ["@/generated/prisma", "*/generated/prisma"],
            message:
              "Do not import from '@/generated/prisma' (no index.ts). " +
              "Import from '@/lib/prisma' for enums/types, or '*/generated/prisma/client' for the raw client.",
          },
        ],
      },
    ],

    "no-restricted-syntax": [
      "error",
      {
        selector: "ExportAllDeclaration",
        message: "Do not use 'export *' syntax. Use explicit named exports to prevent module resolution failures, especially in Server Actions."
      },
      {
        // Server-action storm guard (ACTIVE_DEV_RULES §1B; RCA 20260614-feed-comment-create-action-storm).
        // react-i18next's `t` is NOT identity-stable across renders. In a `useEffect`/`useLayoutEffect`
        // dep array it re-runs the effect every render (storm if it setState/calls a Server Action); in a
        // `useCallback` dep array (for a callback consumed by an effect or an event handler) it churns
        // identity, laundering the same storm into the consumer. Fix: read `t` via a ref synced in an
        // effect (`const tRef = useRef(t); useEffect(() => { tRef.current = t; });` then `tRef.current(...)`)
        // and drop `t` from the deps.
        // SCOPE: `useEffect`/`useLayoutEffect`/`useCallback` only — NOT `useMemo`. A memo runs during render
        // and cannot read a ref (react-hooks/refs), and the React Compiler lint (preserve-manual-memoization
        // + exhaustive-deps) requires `t` to stay in a memo's deps when its body calls `t`. A memo cannot
        // self-storm; if a memo's identity churn feeds an effect, fix the consuming effect (read the memo via
        // a ref, depend on a stable key), not the memo. A render-consumed callback must likewise stay a plain
        // function using `t` directly, not a ref.
        // LIMITS: name-based (only the literal `t`) and no data-flow tracing — a storm laundered through a
        // memo/callback that does not itself list `t` is not caught. Tripwire for the common case, not a proof.
        selector: "CallExpression[callee.name=/^use(Effect|LayoutEffect|Callback)$/] > ArrayExpression > Identifier[name='t']",
        message: "Do not put the react-i18next `t` in a useEffect/useLayoutEffect/useCallback dependency array — it is not identity-stable and storms re-renders/Server Actions (ACTIVE_DEV_RULES §1B). Read it via a ref synced in an effect (`const tRef = useRef(t); useEffect(() => { tRef.current = t; });` then `tRef.current(...)`) and drop `t` from deps. (Render-consumed callbacks should be plain functions using `t`; memos keep `t` in deps and are fixed at the consuming effect.)"
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", {
      "varsIgnorePattern": "^_",
      "argsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "@next/next/no-img-element": "error",
    "react-hooks/set-state-in-effect": "off"
  },
},
// Clean Code Standard — craftsmanship guardrails (docs/standards/clean-code-standard.md).
// Scoped to application source (src/); scripts/ and e2e/ keep their pragmatic tooling
// standards. These are REGRESSION GUARDS: thresholds are calibrated to the current repo
// (gate vs. aspirational target, same model as the M1 god-file gate) so they block NEW
// violations without forcing churn on existing, well-shaped code.
//   - no-empty (allowEmptyCatch:false): a swallowed error must at least carry an intent
//     comment, so silent failures can't slip in.
//   - max-depth 4: deep nesting is a readability/branch-coverage smell.
//   - max-params 5: the target is <=4 / an options object (see the standard); the gate
//     blocks the genuinely-egregious 6+. Cohesive 5-arg signatures (e.g. email senders
//     that already take an options bag) are intentionally allowed — folding a positional
//     into the bag would make call sites less readable, not more.
//   - max-nested-callbacks 4: guards against callback pyramids in app code.
// Function-level complexity and length are tracked by the count ratchet in
// scripts/audits/verify-clean-code-budgets.js (npm run cleancode:check), not here,
// because their pre-existing backlog is too large for a hard per-function gate today.
{
  files: ["src/**/*.ts", "src/**/*.tsx"],
  rules: {
    "no-empty": ["error", { allowEmptyCatch: false }],
    "max-depth": ["error", 4],
    "max-params": ["error", 5],
    "max-nested-callbacks": ["error", 4],
  },
},
// Tests legitimately use many fast-check generator params and nested mock/describe
// callbacks; relax those two budgets there. no-empty and max-depth still apply.
{
  files: [
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/__tests__/**/*.ts",
    "src/__tests__/**/*.tsx",
  ],
  rules: {
    "max-params": "off",
    "max-nested-callbacks": "off",
  },
},
]);

export default eslintConfig;
