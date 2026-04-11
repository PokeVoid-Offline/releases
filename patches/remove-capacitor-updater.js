#!/usr/bin/env node

/**
 * Patch: Remove Capacitor Updater Dependency
 * 
 * This patch removes @capgo/capacitor-updater from the PokeVoid build
 * to fix the build error for offline iOS builds.
 * 
 * Compatible with PokeVoid-Offline/iOS apply-patches.sh
 */

const fs = require('fs');
const path = require('path');

// Determine target directory (pokerogue-src or pokevoid-src)
const possibleDirs = ['pokerogue-src', 'pokevoid-src', '.'];
let TARGET_DIR = null;

for (const dir of possibleDirs) {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    TARGET_DIR = dir;
    break;
  }
}

if (!TARGET_DIR) {
  console.error('Error: Could not find package.json in any expected directory');
  process.exit(1);
}

console.log(`\n========================================`);
console.log(`Patch: Remove Capacitor Updater`);
console.log(`Target: ${TARGET_DIR}`);
console.log(`========================================\n`);

const mainTsPath = path.join(TARGET_DIR, 'src', 'main.ts');
const packageJsonPath = path.join(TARGET_DIR, 'package.json');

let patchedFiles = 0;

// Patch 1: Comment out capacitor-updater imports in main.ts
if (fs.existsSync(mainTsPath)) {
  console.log(`Patching: ${mainTsPath}`);
  let content = fs.readFileSync(mainTsPath, 'utf-8');
  const originalContent = content;
  
  // Comment out the import line
  content = content.replace(
    /^(import.*@capgo\/capacitor-updater.*)/gm,
    '// $1 // PATCHED: Removed for offline build'
  );
  
  // Comment out CapacitorUpdater method calls
  content = content.replace(
    /^(\s*)(CapacitorUpdater\.)/gm,
    '$1// $2 // PATCHED: Removed for offline build'
  );
  
  content = content.replace(
    /^(\s*)(await CapacitorUpdater\.)/gm,
    '$1// $2 // PATCHED: Removed for offline build'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(mainTsPath, content, 'utf-8');
    console.log(`  ✓ Commented out capacitor-updater imports and usage`);
    patchedFiles++;
  } else {
    console.log(`  ℹ No capacitor-updater references found`);
  }
} else {
  console.log(`  ⚠ ${mainTsPath} not found, skipping`);
}

// Patch 2: Remove from package.json
if (fs.existsSync(packageJsonPath)) {
  console.log(`\nPatching: ${packageJsonPath}`);
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  let modified = false;
  
  // Remove from dependencies
  if (packageData.dependencies && packageData.dependencies['@capgo/capacitor-updater']) {
    delete packageData.dependencies['@capgo/capacitor-updater'];
    console.log(`  ✓ Removed @capgo/capacitor-updater from dependencies`);
    modified = true;
  }
  
  // Remove from devDependencies (just in case)
  if (packageData.devDependencies && packageData.devDependencies['@capgo/capacitor-updater']) {
    delete packageData.devDependencies['@capgo/capacitor-updater'];
    console.log(`  ✓ Removed @capgo/capacitor-updater from devDependencies`);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n', 'utf-8');
    patchedFiles++;
  } else {
    console.log(`  ℹ @capgo/capacitor-updater not found in package.json`);
  }
} else {
  console.log(`  ⚠ ${packageJsonPath} not found, skipping`);
}

// Patch 3: Clean up capacitor.config.ts if it exists
const capacitorConfigPath = path.join(TARGET_DIR, 'capacitor.config.ts');
if (fs.existsSync(capacitorConfigPath)) {
  console.log(`\nPatching: ${capacitorConfigPath}`);
  let content = fs.readFileSync(capacitorConfigPath, 'utf-8');
  const originalContent = content;
  
  // Comment out CapacitorUpdater plugin configuration
  content = content.replace(
    /(\s*CapacitorUpdater:\s*\{[^}]*\})/gs,
    '// $1 // PATCHED: Removed for offline build'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(capacitorConfigPath, content, 'utf-8');
    console.log(`  ✓ Commented out CapacitorUpdater configuration`);
    patchedFiles++;
  } else {
    console.log(`  ℹ No CapacitorUpdater configuration found`);
  }
}

console.log(`\n========================================`);
console.log(`Patch complete!`);
console.log(`Files modified: ${patchedFiles}`);
console.log(`========================================\n`);

if (patchedFiles > 0) {
  console.log(`Next steps:`);
  console.log(`  1. Run: npm install (in ${TARGET_DIR})`);
  console.log(`  2. Build should now succeed\n`);
  process.exit(0);
} else {
  console.log(`No files needed patching. Build may already work!\n`);
  process.exit(0);
}
