#!/usr/bin/env node
/**
 * Patch: vite-base-relative.js
 *
 * Sets `base: './'` in vite.config.ts so Vite emits relative asset paths.
 * Without this, Electron loads index.html via file:// and all assets resolve
 * to the filesystem root instead of the dist/ folder, causing ERR_FILE_NOT_FOUND.
 *
 * Targets: pokevoid-src/vite.config.ts
 */

const fs   = require('fs');
const path = require('path');

const TARGET = path.join('pokevoid-src', 'vite.config.ts');

if (!fs.existsSync(TARGET)) {
  console.error(`ERROR: Could not find target file: ${TARGET}`);
  process.exit(1);
}

let src = fs.readFileSync(TARGET, 'utf8').replace(/\r\n/g, '\n');

const ANCHOR = `export const defaultConfig: UserConfig  = {`;
const REPLACEMENT = `export const defaultConfig: UserConfig  = {\n\tbase: './',`;

if (!src.includes(ANCHOR)) {
  console.error('ERROR: Could not find defaultConfig in vite.config.ts.');
  process.exit(1);
}

if (src.includes("base: './'")) {
  console.log('base already set to relative — skipping.');
  process.exit(0);
}

src = src.replace(ANCHOR, REPLACEMENT);
fs.writeFileSync(TARGET, src, 'utf8');
console.log("Set base: './' in vite.config.ts for Electron build.");
