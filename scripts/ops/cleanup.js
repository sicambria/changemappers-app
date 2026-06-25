/**
 * @description Robust project cleanup utility for clearing stale processes and build artifacts.
 * Handles Windows-specific file locks with retry logic.
 * @usage node scripts/ops/cleanup.js
 */

import { cleanupStaleTestProcesses } from './cleanup-stale-processes.mjs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

/**
 * Robustly removes a directory with retries to handle Windows EBUSY/EPERM issues.
 */
async function robustRm(dirPath, attempts = 5, delay = 1000) {
    for (let i = 0; i < attempts; i++) {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
            }
            return true;
        } catch (err) {
            if (i === attempts - 1) throw err;
            console.warn(`⚠️ Attempt ${i + 1} to remove ${path.basename(dirPath)} failed (busy/locked). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

function stopPrismaDevServers() {
    try {
        console.log('🛑 Stopping Prisma dev servers...');
        try {
            // Quote the wildcard so it reaches Prisma literally on both platforms:
            // an unquoted `*` is glob-expanded against CWD by POSIX sh (so Prisma
            // never sees the intended "all servers" wildcard), while cmd leaves it
            // literal — quoting makes the behaviour identical everywhere.
            execSync('npx prisma dev stop "*"', { stdio: 'pipe' });
        } catch {
            execSync('npx prisma dev stop', { stdio: 'pipe' });
        }
    } catch {
        // Ignore errors if prisma dev is not running or command fails
    }
}

function cleanStaleProcesses() {
    if (process.platform !== 'win32') return;
    try {
        console.log('🔫 Searching for and terminating stale Next.js/Node/Prisma processes...');
        const result = cleanupStaleTestProcesses({ currentRoot: root });
        console.log(`[cleanup] inspected ${result.inspected} node process(es), terminated ${result.killed.length}.`);
        for (const target of result.killed) {
            console.log(`[cleanup] killed PID ${target.pid} privateMb=${target.privateMb} command=${target.commandLine}`);
        }
        for (const error of result.errors) {
            console.warn(`[cleanup] failed PID ${error.pid}: ${error.message}`);
        }
        console.log('✅ Stale process cleanup check complete.');
        if (result.errors.length > 0) process.exitCode = 1;
    } catch (e) {
        console.warn('⚠️ Warning during process cleanup:', e.message);
    }
}

function cleanPrismaLocks() {
    const prismaLockPaths = [
        path.join(process.env.USERPROFILE || '', '.prisma', 'client'),
        path.join(process.env.USERPROFILE || '', '.prisma', 'postgres'),
        path.join(root, '.prisma'),
        path.join(root, 'prisma')
    ];
    for (const lockPath of prismaLockPaths) {
        if (!fs.existsSync(lockPath)) continue;
        try {
            const files = fs.readdirSync(lockPath);
            for (const file of files) {
                if (file.endsWith('.lock')) {
                    console.log(`🗑️ Removing Prisma lock file: ${path.join(lockPath, file)}`);
                    fs.unlinkSync(path.join(lockPath, file));
                }
            }
        } catch (err) {
            console.warn(`⚠️ Could not clean lock files in ${lockPath}: ${err.message}`);
        }
    }
}

async function cleanArtifacts() {
    const pathsToClean = ['.next', '.turbo', 'dist', 'out'];
    for (const p of pathsToClean) {
        const fullPath = path.join(root, p);
        if (!fs.existsSync(fullPath)) continue;
        try {
            console.log(`🗑️ Removing ${p} artifact...`);
            await robustRm(fullPath);
        } catch (err) {
            if (err.code === 'EPERM' || err.code === 'EACCES' || err.code === 'EBUSY') {
                console.error(`❌ Failed to remove ${p}: Directory is locked by another process or permissions denied.`);
                console.warn('💡 Tip: Close any IDEs, file explorers, or terminals that might be using the folder.');
            } else {
                console.error(`❌ Error removing ${p}:`, err.message);
            }
        }
    }
}

async function cleanup() {
    console.log('🧹 Cleaning up stale processes and artifacts...');
    stopPrismaDevServers();
    cleanStaleProcesses();
    cleanPrismaLocks();
    await cleanArtifacts();
    console.log('✅ Cleanup complete.');
}

try {
    await cleanup();
} catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
}
