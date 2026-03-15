#!/usr/bin/env node
/**
 * Capsule Post-Build Script
 *
 * Fixes two issues that vite-plugin-web-extension doesn't handle perfectly:
 *
 * 1. The manifest.json gets `public:icons/...` entries — strip the `public:` prefix.
 * 2. The sidebar/index.html uses absolute paths (`/sidebar/index.js`, `/index.css`)
 *    which work in Chrome extensions but only if the files are web-accessible.
 *    We rewrite them to relative paths to be safe across all Chrome versions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// ─── 1. Fix manifest.json icon paths ─────────────────────────────────────────

const manifestPath = path.join(DIST, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

function stripPublicPrefix(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/^public:/, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(stripPublicPrefix);
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = stripPublicPrefix(v);
    }
    return out;
  }
  return obj;
}

const fixedManifest = stripPublicPrefix(manifest);
fs.writeFileSync(manifestPath, JSON.stringify(fixedManifest, null, 2));
console.log('✓ Fixed manifest.json icon paths');

// ─── 2. Fix sidebar & popup index.html asset paths ───────────────────────────
// Rewrite absolute paths to relative paths so they always resolve correctly

function fixHtmlPaths(htmlPath, depth = 1) {
  if (!fs.existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const relativePrefix = '../'.repeat(depth);

  // /sidebar/index.js → ./index.js or /popup/index.js → ./index.js
  html = html.replace(/src="\/[^"]+\/index\.js"/g, 'src="./index.js"');
  
  // /common.css → ../common.css
  html = html.replace(/href="\/common\.css"/g, `href="${relativePrefix}common.css"`);
  
  // Any other absolute /assets/ references
  html = html.replace(/href="\/assets\//g, `href="${relativePrefix}assets/`);
  html = html.replace(/src="\/assets\//g, `src="${relativePrefix}assets/`);

  fs.writeFileSync(htmlPath, html);
  console.log(`✓ Fixed asset paths in ${path.relative(DIST, htmlPath)}`);
}

fixHtmlPaths(path.join(DIST, 'sidebar', 'index.html'), 1);
fixHtmlPaths(path.join(DIST, 'popup', 'index.html'), 1);

// ─── 3. Verify required files exist ──────────────────────────────────────────

const required = [
  'manifest.json',
  'background/service-worker.js',
  'content/inject.js',
  'content/inject.css',
  'sidebar/index.html',
  'sidebar/index.js',
  'popup/index.html',
  'popup/index.js',
  'common.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

let allOk = true;
for (const file of required) {
  const fullPath = path.join(DIST, file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.error(`  ✗ MISSING: ${file}`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\n✅ Capsule build is ready! Load the dist/ folder in Chrome.');
} else {
  console.error('\n❌ Some files are missing. Re-run npm run build.');
  process.exit(1);
}
