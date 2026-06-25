import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_BY_SEGMENT = new Map(Object.entries({
  account: 'PROFILE',
  admin: 'ADMIN',
  api: 'OTHER',
  ap: 'OTHER',
  'api-docs': 'OTHER',
  calendar: 'SCHEDULING',
  canvas: 'CANVAS',
  cases: 'OTHER',
  causes: 'CAUSES',
  coach: 'COACHING',
  coachme: 'COACHING',
  communities: 'COMMUNITY',
  compass: 'COMPASS',
  connections: 'CONNECTIONS',
  contribute: 'CONTRIBUTION',
  dashboard: 'DASHBOARD',
  draw: 'OTHER',
  energy: 'ENERGY',
  events: 'EVENT',
  favorites: 'OTHER',
  feed: 'FEED',
  'forgot-password': 'AUTH',
  glossary: 'LEARNING',
  governance: 'OTHER',
  graph: 'GRAPH',
  growth: 'GROWTH',
  health: 'OTHER',
  help: 'OTHER',
  invite: 'AUTH',
  kanban: 'TASKS',
  learn: 'LEARNING',
  learning: 'LEARNING',
  legal: 'OTHER',
  login: 'AUTH',
  map: 'MAP',
  matchmaking: 'MATCHMAKING',
  meet: 'SCHEDULING',
  mentor: 'MENTORING',
  messages: 'MESSAGES',
  onboarding: 'AUTH',
  peer: 'PEER_SUPPORT',
  pitch: 'PITCH',
  planet: 'OTHER',
  privacy: 'OTHER',
  profile: 'PROFILE',
  reflect: 'REFLECT',
  register: 'AUTH',
  'reset-password': 'AUTH',
  roadmap: 'OTHER',
  settings: 'PROFILE',
  signals: 'OTHER',
  'social-issues': 'SOCIAL_ISSUES',
  stories: 'STORIES',
  tasks: 'TASKS',
  tools: 'OTHER',
  training: 'TRAINING',
  'verify-email': 'AUTH',
  video: 'OTHER',
  volunteer: 'VOLUNTEER',
}));

export function inferRouteModule(routePath) {
  const firstSegment = routePath.split('/').find(Boolean) ?? '';
  return MODULE_BY_SEGMENT.get(firstSegment) ?? 'OTHER';
}

export function collectAppRoutes(appRoot) {
  const routes = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.name !== 'page.tsx' && entry.name !== 'route.ts') {
        continue;
      }

      const relativeSegments = path
        .relative(appRoot, dir)
        .split(path.sep)
        .filter(Boolean)
        .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
      const routePath = relativeSegments.length === 0 ? '/' : `/${relativeSegments.join('/')}`;

      routes.push({ path: routePath, module: inferRouteModule(routePath) });
    }
  }

  walk(appRoot);
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

export function writeRoutesJson({ appRoot, outputPath }) {
  const routes = collectAppRoutes(appRoot);
  fs.writeFileSync(outputPath, `${JSON.stringify(routes, null, 2)}\n`);
  return routes;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const repoRoot = process.cwd();
  const routes = writeRoutesJson({
    appRoot: path.join(repoRoot, 'src', 'app'),
    outputPath: path.join(repoRoot, 'routes.json'),
  });
  console.log(`Generated routes.json with ${routes.length} routes.`);
}
