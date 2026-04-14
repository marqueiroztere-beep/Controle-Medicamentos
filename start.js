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

console.log('=== Starting MedControl ===');
console.log('Node:', process.version);
console.log('CWD:', process.cwd());
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATA_DIR:', process.env.DATA_DIR);

const fs = require('fs');
const dataDir = process.env.DATA_DIR;

/**
 * Railway mounts volumes AFTER the container starts.
 * Check /proc/mounts to know when the volume is truly mounted,
 * not just a regular directory in the container filesystem.
 */
function isVolumeMounted(dir) {
  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf8');
    return mounts.includes(' ' + dir + ' ');
  } catch {
    return false;
  }
}

function waitForVolume(dir, maxWait) {
  return new Promise((resolve) => {
    if (!dir) return resolve();

    // If already mounted, go
    if (isVolumeMounted(dir)) {
      const files = fs.readdirSync(dir);
      console.log(`Volume already mounted at ${dir}. Files:`, files);
      return resolve();
    }

    console.log(`Waiting for volume mount at ${dir}...`);
    const start = Date.now();

    function check() {
      if (isVolumeMounted(dir)) {
        const elapsed = Date.now() - start;
        const files = fs.readdirSync(dir);
        console.log(`Volume mounted at ${dir} (${elapsed}ms). Files:`, files);
        return resolve();
      }
      if (Date.now() - start > maxWait) {
        console.warn(`Volume not detected after ${maxWait}ms. Starting without persistent storage.`);
        return resolve();
      }
      setTimeout(check, 300);
    }
    check();
  });
}

waitForVolume(dataDir, 30000).then(() => {
  try {
    require('./backend/dist/app.js');
  } catch (err) {
    console.error('[FATAL] Failed to load app:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
});
