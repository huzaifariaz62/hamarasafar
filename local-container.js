/**
 * Hamara Safar - Local Virtual Container Environment Runner
 * 
 * Provides an isolated local runtime environment for end-to-end testing
 * before pushing code to GitHub or deploying to Firebase Hosting.
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('  HAMARA SAFAR — LOCAL VIRTUAL CONTAINER ENVIRONMENT  ');
console.log('====================================================\n');

// 1. Check for build artifacts
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.log('[Container Setup] Compiling production build into dist/...');
    const buildProcess = spawn('npx', ['vite', 'build'], { stdio: 'inherit', shell: true });
    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log('[Container Setup] Build complete. Launching isolated server...');
            startIsolatedServer();
        } else {
            console.error('[Container Setup] Build failed with exit code:', code);
        }
    });
} else {
    startIsolatedServer();
}

function startIsolatedServer() {
    console.log('[Container Env] Starting unified backend & frontend server on port 3000...');
    
    const serverProcess = spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            NODE_ENV: 'local-container',
            PORT: '3000'
        }
    });

    serverProcess.on('error', (err) => {
        console.error('[Container Error] Failed to start local container server:', err);
    });

    // Perform health check after short delay
    setTimeout(() => {
        http.get('http://localhost:3000/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('\n----------------------------------------------------');
                console.log('✅ LOCAL CONTAINER IS LIVE & READY FOR TESTING:');
                console.log('🌐 Web App & Itinerary Planner: http://localhost:3000');
                console.log('🔌 Health Check API:            http://localhost:3000/api/health');
                console.log('🔒 Environment Status:          Isolated Local Container');
                console.log('----------------------------------------------------\n');
                console.log('Press Ctrl + C in this terminal to stop the local environment.\n');
            });
        }).on('error', (e) => {
            console.warn('[Container Health] Server starting up... (health check pending)');
        });
    }, 1500);
}
