/**
 * Makes the dist/ directory read-only (Unix only).
 * Run after build on Linux to prevent tampering with built files.
 * No-op on Windows.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const distPath = path.join(__dirname, '..', 'dist');

if (process.platform === 'win32') {
  console.log('lock-dist: skipped (Windows); run chmod on Linux after build.');
  process.exit(0);
}

if (!fs.existsSync(distPath)) {
  console.error('lock-dist: dist/ not found. Run build first.');
  process.exit(1);
}

try {
  execSync(`chmod -R a-w "${distPath}"`, { stdio: 'inherit' });
  console.log('lock-dist: dist/ is now read-only.');
} catch (err) {
  console.error('lock-dist: chmod failed.', err.message);
  process.exit(1);
}
