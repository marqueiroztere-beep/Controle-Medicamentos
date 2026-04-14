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
 * Railway mounts volumes AFTER the container process starts.
 * The Dockerfile creates /data/.container_marker inside the image.
 * When the volume mounts over /data, the marker disappears.
 * We wait until the marker is gone = volume is mounted.
 */
function isVolumeMounted(dir) {
  try {
    // If the marker exists, the volume hasn't mounted yet
    fs.accessSync(dir + '/.container_marker');
    return false; // Marker still there = no volume yet
  } catch {
    // Marker gone (or dir doesn't exist) = volume mounted over it
    // Double-check the dir itself exists and is writable
    try {
      fs.accessSync(dir);
      return true;
    } catch {
      return false;
    }
  }
}

function waitForVolume(dir, maxWait) {
  return new Promise((resolve) => {
    if (!dir) {
      console.log('No DATA_DIR configured, using default path.');
      return resolve();
    }

    if (isVolumeMounted(dir)) {
      const files = fs.readdirSync(dir);
      console.log(`Volume already mounted at ${dir}. Files:`, files);
      return resolve();
    }

    console.log(`Waiting for volume mount at ${dir} (marker: ${dir}/.container_marker)...`);
    const start = Date.now();

    function check() {
      if (isVolumeMounted(dir)) {
        const elapsed = Date.now() - start;
        const files = fs.readdirSync(dir);
        console.log(`Volume mounted at ${dir} (waited ${elapsed}ms). Files:`, files);
        return resolve();
      }
      const elapsed = Date.now() - start;
      if (elapsed > maxWait) {
        console.warn(`Volume not detected after ${maxWait}ms. Starting without persistent volume.`);
        // Remove the marker so the app can use /data as a fallback
        try { fs.unlinkSync(dir + '/.container_marker'); } catch {}
        return resolve();
      }
      // Log every 5 seconds
      if (elapsed % 5000 < 300) {
        console.log(`Still waiting for volume... (${Math.round(elapsed / 1000)}s)`);
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
