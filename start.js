// Entry point with error capture BEFORE any imports
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

const fs = require('fs');

console.log('=== Starting MedControl ===');
console.log('Node:', process.version);
console.log('CWD:', process.cwd());
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATA_DIR:', process.env.DATA_DIR);

// Debug: find where the volume is actually mounted
try {
  const mounts = fs.readFileSync('/proc/mounts', 'utf8');
  const volumeLines = mounts.split('\n').filter(l =>
    !l.startsWith('proc ') && !l.startsWith('sysfs ') && !l.startsWith('cgroup') &&
    !l.startsWith('devpts ') && !l.startsWith('mqueue ') && !l.startsWith('tmpfs ') &&
    !l.startsWith('devtmpfs ') && !l.includes('/dev/shm') && !l.includes('/sys/') &&
    !l.includes('/proc/') && l.trim()
  );
  console.log('=== Mount points ===');
  volumeLines.forEach(l => console.log(' ', l));
} catch (e) {
  console.log('/proc/mounts not available:', e.code);
}

// Debug: list key directories
for (const dir of ['/data', '/app/data', '/mnt', '/vol', '/volume', '/persist']) {
  try {
    const files = fs.readdirSync(dir);
    console.log(`${dir}/ contains:`, files);
  } catch {
    console.log(`${dir}/ does not exist`);
  }
}

// Start the app directly — we'll fix the volume path after seeing the logs
try {
  require('./backend/dist/app.js');
} catch (err) {
  console.error('[FATAL] Failed to load app:', err.message);
  console.error(err.stack);
  process.exit(1);
}
