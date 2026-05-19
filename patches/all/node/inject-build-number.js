#!/usr/bin/env node
/**
 * Patch: inject-build-number.js
 *
 * Appends the offline build number to the version string displayed in the
 * bottom-right corner of the title screen.
 *
 * The string "BUILD_NUMBER_PLACEHOLDER" is replaced by the workflow with the
 * actual GitHub Actions run number before pnpm build runs.
 *
 * Targets: pokevoid-src/src/system/game-data.ts
 */

const fs   = require("fs");
const path = require("path");

const TARGET = path.join("pokevoid-src", "src", "system", "game-data.ts");

if (!fs.existsSync(TARGET)) {
  console.error(`ERROR: Could not find target file: ${TARGET}`);
  process.exit(1);
}

// Read and normalise line endings so the match works on both Windows and Linux runners
let src = fs.readFileSync(TARGET, "utf8").replace(/\r\n/g, "\n");

// Match getDisplayVersion() regardless of exact whitespace/indentation
const PATTERN = /(public getDisplayVersion\(\): string \{[\s\S]*?return this\.formatVersionWithInternal\(baseVersion\);[\s\S]*?\})/;

if (!PATTERN.test(src)) {
  console.error("ERROR: Could not find getDisplayVersion() in game-data.ts.");
  console.error("The file may have been updated upstream. Manual inspection required.");
  process.exit(1);
}

src = src.replace(PATTERN, (match) => {
  return match.replace(
    "return this.formatVersionWithInternal(baseVersion);",
    `const formatted = this.formatVersionWithInternal(baseVersion);\n        return formatted + " (Build BUILD_NUMBER_PLACEHOLDER)";`
  );
});

fs.writeFileSync(TARGET, src, "utf8");
console.log("Build number injected into getDisplayVersion() successfully.");
