#!/usr/bin/env node

console.log('🚀 EMERGENCY: Starting Next.js Frontend for Data Unification...');

const { spawn } = require('child_process');

const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  env: { ...process.env }
});

nextProcess.on('error', (err) => {
  console.error(`❌ Next.js startup failed: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Next.js...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

console.log('✅ Next.js startup script running...');
console.log('🌐 Frontend will be available at: http://localhost:3000');