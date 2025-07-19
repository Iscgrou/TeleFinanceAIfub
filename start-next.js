#!/usr/bin/env node

import { spawn } from 'child_process';

const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Next.js exited with code ${code}`);
  }
  process.exit(code);
});