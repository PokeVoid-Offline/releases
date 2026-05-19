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

let src = fs.readFileSync(TARGET, "utf8");

const ORIGINAL = `    public getDisplayVersion(): string {
        const baseVersion = i18next.t("menu:gameVersion") || this.scene.game.config.gameVersion;
        return this.formatVersionWithInternal(baseVersion);
    }`;

const REPLACEMENT = `    public getDisplayVersion(): string {
        const baseVersion = i18next.t("menu:gameVersion") || this.scene.game.config.gameVersion;
        const formatted = this.formatVersionWithInternal(baseVersion);
        return formatted + " (Build BUILD_NUMBER_PLACEHOLDER)";
    }`;

if (!src.includes(ORIGINAL)) {
  console.error("ERROR: Could not find getDisplayVersion() in game-data.ts.");
  console.error("The file may have been updated upstream. Manual inspection required.");
  process.exit(1);
}

src = src.replace(ORIGINAL, REPLACEMENT);
fs.writeFileSync(TARGET, src, "utf8");
console.log("Build number injected into getDisplayVersion() successfully.");
