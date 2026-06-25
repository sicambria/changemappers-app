/**
 * @description Terminates stale local app/test Node processes without deleting build artifacts.
 * @usage npm run cleanup:processes
 */

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { platform } from 'node:os';

/**
 * @typedef {Object} ProcessInfo
 * @property {number} pid
 * @property {string} name
 * @property {number} privateMb
 * @property {string} commandLine
 * @property {number} [parentPid]
 * @property {number} [workingSetMb]
 */

/**
 * @typedef {Object} StaleSelectionOptions
 * @property {number} [currentPid]
 * @property {ProcessInfo[]} [processes]
 * @property {string} [currentRoot]
 * @property {string[]} [otherWorktreeRoots]
 */

const protectedCommandMarkers = [
  '@openai',
  'codex',
  'cursor',
  'vscode',
  'cleanup-stale-processes.mjs',
];

const staleCommandMarkers = [
  'next\\dist\\server\\lib\\start-server.js',
  'next/dist/server/lib/start-server.js',
  'next\\dist\\bin\\next',
  'next/dist/bin/next',
  '.next\\standalone\\server.js',
  '.next/standalone/server.js',
  'playwright/test/cli.js',
  'playwright\\test\\cli.js',
  'scripts/testing/run-e2e-with-monitor.mjs',
  'scripts\\testing\\run-e2e-with-monitor.mjs',
  'scripts/testing/run-e2e-with-diagnostics.js',
  'scripts\\testing\\run-e2e-with-diagnostics.js',
  'scripts/testing/run-major-tests.js',
  'scripts\\testing\\run-major-tests.js',
  'vitest.mjs',
  'vitest\\vitest.mjs',
];

const foreignWorktreeMarkers = [
  '/.antigravity/worktrees/',
  '/.claude/worktrees/',
  '/worktrees/',
];

function normalize(value) {
  return String(value ?? '').replaceAll('\\', '/').toLowerCase();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isProtectedProcess(processInfo, currentPid = process.pid) {
  if (toNumber(processInfo.pid) === currentPid) return true;

  const commandLine = normalize(processInfo.commandLine);
  return protectedCommandMarkers.some((marker) => commandLine.includes(normalize(marker)));
}

function isMissingProcessTaskkillError(error) {
  const output = `${error?.stdout ?? ''}\n${error?.stderr ?? ''}\n${error?.message ?? ''}`.toLowerCase();
  return output.includes('not found')
    || output.includes('not running')
    || output.includes('no running instance')
    || output.includes('nincs olyan fut');
}

function buildProcessMap(processes) {
  return new Map(processes.map((processInfo) => [toNumber(processInfo.pid), processInfo]));
}

function getProcessLineage(processInfo, processMap) {
  const lineage = [];
  const seen = new Set();
  let current = processInfo;

  while (current && !seen.has(toNumber(current.pid))) {
    lineage.push(current);
    seen.add(toNumber(current.pid));
    current = processMap.get(toNumber(current.parentPid));
  }

  return lineage;
}

/**
 * @param {ProcessInfo} processInfo
 * @param {StaleSelectionOptions} [options]
 */
function isForeignWorktreeProcess(processInfo, { processes = [], currentRoot = process.cwd(), otherWorktreeRoots = [] } = {}) {
  const root = normalize(currentRoot);
  const processMap = buildProcessMap(processes);
  const lineage = getProcessLineage(processInfo, processMap);

  const currentRootIsWorktree = foreignWorktreeMarkers.some((marker) => root.includes(marker.replace(/\/$/, '')));

  // A sibling git worktree (e.g. another concurrent agent's checkout) is foreign even
  // though its path does not contain a generic /worktrees/ marker. Protect any process
  // whose own command line points at a worktree root other than the one we run from.
  const siblingRoots = otherWorktreeRoots
    .map((value) => normalize(value))
    .filter((value) => value && value !== root);
  const ownCommandLine = normalize(processInfo.commandLine);
  if (siblingRoots.some((siblingRoot) => ownCommandLine.includes(siblingRoot))) {
    return true;
  }

  return lineage.some((lineageProcess) => {
    const commandLine = normalize(lineageProcess.commandLine);
    if (!commandLine) return false;
    const hasWorktreeMarker = foreignWorktreeMarkers.some((marker) => commandLine.includes(marker));
    if (!hasWorktreeMarker) return false;
    return !(currentRootIsWorktree && root && commandLine.includes(root));
  });
}

/**
 * @param {ProcessInfo} processInfo
 * @param {StaleSelectionOptions} [options]
 * @returns {boolean}
 */
export function isStaleTestProcess(processInfo, { currentPid = process.pid, processes = [], currentRoot = process.cwd(), otherWorktreeRoots = [] } = {}) {
  if (!processInfo || isProtectedProcess(processInfo, currentPid)) return false;

  if (isForeignWorktreeProcess(processInfo, { processes, currentRoot, otherWorktreeRoots })) return false;

  const name = normalize(processInfo.name);
  if (!name.includes('node')) return false;

  const commandLine = normalize(processInfo.commandLine);
  if (!commandLine) return false;

  return staleCommandMarkers.some((marker) => commandLine.includes(normalize(marker)));
}

function listWindowsNodeProcesses() {
  const script = `
$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | ForEach-Object {
  [pscustomobject]@{
    pid = $_.ProcessId
    parentPid = $_.ParentProcessId
    name = $_.Name
    privateMb = [math]::Round($_.PrivatePageCount / 1MB, 1)
    workingSetMb = [math]::Round($_.WorkingSetSize / 1MB, 1)
    commandLine = $_.CommandLine
  }
}
@($processes) | ConvertTo-Json -Depth 3
`;

  const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    timeout: 10_000,
    windowsHide: true,
  }).trim();

  if (!output) return [];
  const parsed = JSON.parse(output);
  return (Array.isArray(parsed) ? parsed : [parsed]).map((processInfo) => ({
    pid: toNumber(processInfo.pid),
    parentPid: toNumber(processInfo.parentPid),
    name: String(processInfo.name ?? ''),
    privateMb: toNumber(processInfo.privateMb),
    workingSetMb: toNumber(processInfo.workingSetMb),
    commandLine: String(processInfo.commandLine ?? ''),
  }));
}

// One `ps` row: pid, ppid, rss(KB), comm, then the (optional) full command line.
const PS_LINE_PATTERN = /^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)(?:\s+(.*))?$/;

/**
 * Parse `ps` output (one process per line: pid ppid rss comm args...) into the
 * normalized process shape the selection logic expects. RSS is reported in KB.
 * Only node-named processes are kept, mirroring the Windows `node.exe` scope —
 * downstream markers narrow this to actual stale test/dev runners.
 * @param {string} output raw `ps` stdout
 * @returns {ProcessInfo[]}
 */
export function parsePsOutput(output) {
  const lines = String(output ?? '').split('\n');
  const processes = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = PS_LINE_PATTERN.exec(line);
    if (!match) continue;

    const pid = toNumber(match[1]);
    if (pid <= 0) continue;

    const comm = String(match[4] ?? '');
    const commandLine = String(match[5] ?? '');

    // `comm` is an unreliable node signal on Linux: Node 24 names its main thread
    // "MainThread", so `ps comm=` reports that rather than "node". Detect node by the
    // executable basename in the command line (the first arg token), falling back to comm.
    const execBase = (commandLine.split(/\s+/)[0] ?? '').replaceAll('\\', '/').split('/').pop()?.toLowerCase() ?? '';
    const isNode = comm.toLowerCase().includes('node') || execBase === 'node' || execBase === 'node.exe';
    if (!isNode) continue;

    const rssKb = toNumber(match[3]);
    const memMb = Math.round((rssKb / 1024) * 10) / 10;

    processes.push({
      pid,
      parentPid: toNumber(match[2]),
      name: 'node',
      privateMb: memMb,
      workingSetMb: memMb,
      commandLine,
    });
  }

  return processes;
}

function listLinuxNodeProcesses() {
  let output = '';
  try {
    output = execFileSync('ps', ['-eo', 'pid=,ppid=,rss=,comm=,args=', '--no-headers'], {
      encoding: 'utf8',
      timeout: 10_000,
    });
  } catch {
    // ps unavailable or failed — never throw at push time; just skip cleanup.
    return [];
  }
  return parsePsOutput(output);
}

/**
 * Roots of every git worktree attached to this checkout (so sibling worktrees —
 * e.g. another concurrent agent's run — can be protected). Returns [] on any failure.
 * @returns {string[]} normalized absolute worktree paths
 */
export function listGitWorktreeRoots(currentRoot = process.cwd()) {
  try {
    const output = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      encoding: 'utf8',
      timeout: 10_000,
      cwd: currentRoot,
    });
    return String(output)
      .split('\n')
      .filter((line) => line.startsWith('worktree '))
      .map((line) => normalize(line.slice('worktree '.length).trim()))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function listNodeProcesses() {
  if (platform() === 'win32') return listWindowsNodeProcesses();
  if (platform() === 'linux') return listLinuxNodeProcesses();
  return [];
}

function killWindowsProcessTree(pid) {
  try {
    execFileSync('taskkill.exe', ['/pid', String(pid), '/t', '/f'], {
      encoding: 'utf8',
      timeout: 30_000,
      windowsHide: true,
    });
  } catch (error) {
    if (isMissingProcessTaskkillError(error)) return;
    throw error;
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  if (platform() === 'win32') {
    killWindowsProcessTree(pid);
    return;
  }

  process.kill(pid, 'SIGTERM');
}

/**
 * @param {ProcessInfo[]} processes
 * @param {StaleSelectionOptions} [options]
 * @returns {ProcessInfo[]}
 */
export function selectStaleTestProcesses(processes, options = {}) {
  return processes
    .filter((processInfo) => isStaleTestProcess(processInfo, { ...options, processes }))
    .sort((a, b) => toNumber(b.privateMb) - toNumber(a.privateMb));
}

/**
 * @param {{ dryRun?: boolean } & StaleSelectionOptions} [options]
 */
export function cleanupStaleTestProcesses({
  dryRun = false,
  processes = listNodeProcesses(),
  currentPid = process.pid,
  currentRoot = process.cwd(),
  otherWorktreeRoots = listGitWorktreeRoots(currentRoot),
} = {}) {
  const targets = selectStaleTestProcesses(processes, { currentPid, currentRoot, otherWorktreeRoots });
  const killed = [];
  const errors = [];

  for (const target of targets) {
    if (!dryRun) {
      try {
        killProcessTree(target.pid);
      } catch (error) {
        errors.push({ pid: target.pid, message: error.message });
        continue;
      }
    }

    killed.push(target);
  }

  return { inspected: processes.length, killed, errors };
}

function isDirectRun() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectRun()) {
  const dryRun = process.argv.includes('--dry-run') || process.env.PUSH_MEMORY_CLEANUP_DRY_RUN === '1';
  const result = cleanupStaleTestProcesses({ dryRun });
  const action = dryRun ? 'would terminate' : 'terminated';
  console.log(`[cleanup:processes] inspected ${result.inspected} node process(es), ${action} ${result.killed.length}.`);
  for (const target of result.killed) {
    console.log(`[cleanup:processes] ${dryRun ? 'target' : 'killed'} PID ${target.pid} privateMb=${target.privateMb} command=${target.commandLine}`);
  }
  for (const error of result.errors) {
    console.warn(`[cleanup:processes] failed PID ${error.pid}: ${error.message}`);
  }
  process.exitCode = result.errors.length > 0 ? 1 : 0;
}
