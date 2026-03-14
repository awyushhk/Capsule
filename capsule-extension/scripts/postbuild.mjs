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

// ─── 2. Fix sidebar/index.html asset paths ───────────────────────────────────
// Rewrite absolute paths to relative paths so they always resolve correctly
// regardless of Chrome extension URL structure

const sidebarHtmlPath = path.join(DIST, 'sidebar', 'index.html');
let sidebarHtml = fs.readFileSync(sidebarHtmlPath, 'utf-8');

// /sidebar/index.js → ./index.js  (same directory)
sidebarHtml = sidebarHtml.replace(/src="\/sidebar\/index\.js"/g, 'src="./index.js"');

// /index.css → ../index.css  (one level up from sidebar/)
sidebarHtml = sidebarHtml.replace(/href="\/index\.css"/g, 'href="../index.css"');

// Any other absolute /assets/ references
sidebarHtml = sidebarHtml.replace(/href="\/assets\//g, 'href="../assets/');
sidebarHtml = sidebarHtml.replace(/src="\/assets\//g, 'src="../assets/');

fs.writeFileSync(sidebarHtmlPath, sidebarHtml);
console.log('✓ Fixed sidebar/index.html asset paths');

// ─── 3. Verify required files exist ──────────────────────────────────────────

const required = [
  'manifest.json',
  'background/service-worker.js',
  'content/inject.js',
  'content/inject.css',
  'sidebar/index.html',
  'sidebar/index.js',
  'index.css',
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
