/**
 * Cross-platform copy script for Next.js standalone output.
 * Replaces Unix-specific `cp -r` commands in build pipeline.
 * Works on Windows, macOS, and Linux.
 */

const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source path does not exist: ${src}`);
    return;
  }

  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const projectRoot = path.resolve(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('Standalone directory not found. Did you set output: "standalone" in next.config?');
  process.exit(1);
}

// Copy .next/static into .next/standalone/.next/static
const staticSrc = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
console.log('Copying .next/static -> .next/standalone/.next/static');
copyRecursiveSync(staticSrc, staticDest);

// Copy public into .next/standalone/public
const publicSrc = path.join(projectRoot, 'public');
const publicDest = path.join(standaloneDir, 'public');
console.log('Copying public -> .next/standalone/public');
copyRecursiveSync(publicSrc, publicDest);

console.log('Standalone copy complete!');
