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

// Wait for volume mount before starting (Railway mounts volumes after container start)
const fs = require('fs');
const dataDir = process.env.DATA_DIR;

function waitForVolume(dir, maxWait) {
  return new Promise((resolve) => {
    if (!dir) return resolve();
    const start = Date.now();
    const dbFile = dir + '/medications.db';

    // Check if volume is mounted by trying to write a test file
    function check() {
      try {
        fs.mkdirSync(dir, { recursive: true });
        const testFile = dir + '/.mount_test';
        fs.writeFileSync(testFile, Date.now().toString());
        const content = fs.readFileSync(testFile, 'utf8');
        fs.unlinkSync(testFile);
        if (content) {
          const files = fs.readdirSync(dir);
          console.log(`Volume ready at ${dir} (${Date.now() - start}ms). Files:`, files);
          return resolve();
        }
      } catch (e) {
        // Not ready yet
      }
      if (Date.now() - start > maxWait) {
        console.warn(`Volume wait timeout (${maxWait}ms). Starting anyway.`);
        return resolve();
      }
      setTimeout(check, 500);
    }
    check();
  });
}

waitForVolume(dataDir, 10000).then(() => {
  try {
    require('./backend/dist/app.js');
  } catch (err) {
    console.error('[FATAL] Failed to load app:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
});
