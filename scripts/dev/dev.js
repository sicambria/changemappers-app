/**
 * @description Custom development server startup script with environment prep.
 * @usage npx tsx scripts/dev/dev.js
 */

import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import net from 'node:net';
import { scheduleDevRouteWarmup } from './route-warmup.js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

/**
 * Checks if a TCP port is open.
 */
function isPortOpen(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

/**
 * Waits for a port to be open with a timeout.
 */
async function _waitForPort(port, timeoutMs = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        if (await isPortOpen(port)) return true;
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

async function startDev() {
    process.stdout.write('\x1Bc'); // Clear console
    console.log('🚀 Starting business logic - Changemappers Dev Server...');
    console.log(`📌 Current Process ID: ${process.pid}`);

    // 1. Run Health Check
    try {
        console.log('🏥 Running environment health check...');
        execSync('node scripts/diagnostics/health-check.js', { cwd: root, stdio: 'inherit' });
    } catch {
        console.error('❌ Health check failed. Aborting startup.');
        process.exit(1);
    }

    // 2. 🛡️ Cleanup stale lock file and processes
    const lockFile = path.join(root, '.next', 'dev', 'lock');
    const devDir = path.join(root, '.next', 'dev');

    if (!fs.existsSync(devDir)) {
        fs.mkdirSync(devDir, { recursive: true });
    }

    const cleanupStaleEverything = async () => {
        try {
            console.log('🔫 Searching for and terminating stale Next.js/Prisma processes...');
            const currentPid = process.pid;
            const psCommand = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe' AND ProcessId <> ${currentPid}" | Where-Object { $cmd = $_.CommandLine; $cmd -and $cmd -notlike '*@openai*codex*' -and $cmd -notlike '*codex.js*' -and ($cmd -like '*next*' -or $cmd -like '*prisma*') }`;
            const killCommand = `${psCommand} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
            try {
                execSync(killCommand, { stdio: 'inherit', shell: 'powershell.exe' });
            } catch { }

            try {
                console.log('📡 Clearing Next.js default port (3000)...');
                execSync('npx -y kill-port 3000', { stdio: 'inherit' });
            } catch { }

            await new Promise(resolve => setTimeout(resolve, 1500));

            if (fs.existsSync(lockFile)) {
                console.log('🗑️ Removing stale Next.js lock file...');
                fs.unlinkSync(lockFile);
            }

            // Also clean Prisma lock files
            const prismaLockPaths = [
                path.join(process.env.USERPROFILE || '', '.prisma', 'client'),
                path.join(process.env.USERPROFILE || '', '.prisma', 'postgres'),
                path.join(root, '.prisma'),
                path.join(root, 'prisma')
            ];

            for (const lp of prismaLockPaths) {
                if (fs.existsSync(lp)) {
                    const files = fs.readdirSync(lp);
                    for (const file of files) {
                        if (file.endsWith('.lock')) {
                            console.log(`🗑️ Removing Prisma lock file: ${path.join(lp, file)}`);
                            fs.unlinkSync(path.join(lp, file));
                        }
                    }
                }
            }
        } catch (err) {
            console.error('❌ Failed to clean up stale state:', err.message);
        }
    };

    if (fs.existsSync(lockFile)) {
        console.log('🧹 Found stale Next.js lock file, attempting cleanup...');
        await cleanupStaleEverything();
    }

    // 4. Start Next.js with Turbopack (5-10x faster HMR than Webpack)
    // DEP0190: Don't pass args array when shell: true.
    // On Windows, npx requires shell: true or npx.cmd.
    const devProcess = spawn('npx next dev --turbopack', {
        cwd: root,
        stdio: 'inherit',
        shell: true
    });
    scheduleDevRouteWarmup({
        rootDir: root,
        baseUrl: 'http://127.0.0.1:3000',
        waitForReady: () => _waitForPort(3000, 60000)
    });


    const cleanup = () => {
        console.log('\n👋 Shutting down dev server...');
        devProcess.kill();
        process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    devProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`👋 Development server exited with code ${code}`);
        } else {
            console.log('👋 Development server stopped.');
        }
    });
}

try {
    await startDev();
} catch (err) {
    console.error('❌ Failed to start development server:', err);
    process.exit(1);
}
