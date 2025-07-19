#!/usr/bin/env node

import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

console.log('🚀 Starting Phoenix Protocol Hybrid Architecture...');

// Start Express backend
console.log('📡 Starting Express backend on port 5000...');
const expressProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'development' }
});

expressProcess.stdout.on('data', (data) => {
  console.log(`[EXPRESS] ${data.toString().trim()}`);
});

expressProcess.stderr.on('data', (data) => {
  console.error(`[EXPRESS ERROR] ${data.toString().trim()}`);
});

// Wait for Express to be ready, then start Next.js
setTimeout(() => {
  console.log('⚡ Starting Next.js frontend on port 3000...');
  const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  nextProcess.stdout.on('data', (data) => {
    console.log(`[NEXT.JS] ${data.toString().trim()}`);
  });

  nextProcess.stderr.on('data', (data) => {
    console.error(`[NEXT.JS ERROR] ${data.toString().trim()}`);
  });

  nextProcess.on('close', (code) => {
    console.log(`[NEXT.JS] Process exited with code ${code}`);
  });

  nextProcess.on('error', (err) => {
    console.error(`[NEXT.JS] Failed to start: ${err.message}`);
  });

}, 5000);

expressProcess.on('close', (code) => {
  console.log(`[EXPRESS] Process exited with code ${code}`);
  process.exit(code);
});

expressProcess.on('error', (err) => {
  console.error(`[EXPRESS] Failed to start: ${err.message}`);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down hybrid architecture...');
  expressProcess.kill('SIGINT');
  process.exit(0);
});

console.log('✅ Hybrid startup script initialized');
console.log('📊 Express Backend: http://localhost:5000');
console.log('🌐 Next.js Frontend: http://localhost:3000');