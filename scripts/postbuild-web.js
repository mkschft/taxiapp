// Post-build step for the web deploy.
// After `expo export --platform web` (output in ./dist), this:
//   1. moves the whole Expo app under dist/app/  (so it's served at /app, matching experiments.baseUrl)
//   2. copies the static marketing landing (./landing) into the dist/ root (served at /)
// Result: "/" = landing, "/app" = the app. One repo, one deploy.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const appDir = path.join(distDir, 'app');
const landingDir = path.join(root, 'landing');

if (!fs.existsSync(distDir)) {
  console.error('postbuild-web: dist/ not found — did `expo export --platform web` run?');
  process.exit(1);
}
if (!fs.existsSync(landingDir)) {
  console.error('postbuild-web: landing/ not found.');
  process.exit(1);
}

// 1) Move every current top-level entry in dist/ into dist/app/.
fs.mkdirSync(appDir, { recursive: true });
for (const entry of fs.readdirSync(distDir)) {
  if (entry === 'app') continue;
  fs.renameSync(path.join(distDir, entry), path.join(appDir, entry));
}

// 2) Copy the static landing into the dist/ root.
fs.cpSync(landingDir, distDir, { recursive: true });

console.log('postbuild-web: app nested under dist/app/, landing copied to dist/ root.');
