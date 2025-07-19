import { spawn } from 'child_process';

// Start Express server
const express = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for Express to start
setTimeout(() => {
  // Start Next.js dev server
  const nextjs = spawn('npx', ['next', 'dev', '-p', '3000'], {
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    express.kill();
    nextjs.kill();
    process.exit();
  });
}, 2000);

console.log('Starting Express on port 5000 and Next.js on port 3000...');