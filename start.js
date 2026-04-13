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

try {
  require('./backend/dist/app.js');
} catch (err) {
  console.error('[FATAL] Failed to load app:', err.message);
  console.error(err.stack);
  process.exit(1);
}
