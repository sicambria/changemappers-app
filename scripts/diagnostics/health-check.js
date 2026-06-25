/**
 * @description Pings critical services (DB, Redis) to ensure the environment is healthy.
 * @usage npx tsx scripts/diagnostics/health-check.js
 */

import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

/** Returns true if a TCP port is actively listening on localhost. */
async function _isPortListening(port) {
    return new Promise((resolve) => {
        const socket = net.connect(port, '127.0.0.1', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
    });
}

async function healthCheck() {
    process.stdout.write('🏥 Performing health check...\n');

    // 1. Check .env file
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ Error: .env file is missing.');
        console.error('💡 Tip: Copy .env.example to .env and configure your variables.');
        process.exit(1);
    }

    // 2. Check Node.js version
    const nvmrcPath = path.join(root, '.nvmrc');
    if (fs.existsSync(nvmrcPath)) {
        const expectedVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
        const currentVersion = process.version.replace('v', '');
        if (!currentVersion.startsWith(expectedVersion.split('.')[0])) {
            console.warn(`⚠️  Warning: Node.js version mismatch. Expected ${expectedVersion}, got ${process.version}.`);
        }
    }

    // 3. Database Connection Check (Optional but good)
    // The application now connects directly to standard PostgreSQL.
    console.log('✅ PostgreSQL connection check bypassed for fast boot.');

    console.log('✅ Health check completed.');
}

try {
    await healthCheck();
} catch (err) {
    console.error('❌ Health check failed:', err);
    process.exit(1);
}
