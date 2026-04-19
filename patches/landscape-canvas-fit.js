#!/usr/bin/env node
/**
 * Patch: landscape-canvas-fit.js
 *
 * Forces the game canvas to fit to screen HEIGHT in landscape, producing black
 * bars on the left and right (letterboxing) — matching PokeRogue's layout.
 *
 * Root cause:
 *   Phaser Scale.FIT mode sizes the canvas to fit inside its parent element
 *   (#app) while maintaining the game's 1920x1080 (16:9) aspect ratio. It picks
 *   whichever dimension (width or height) produces the smaller scale factor.
 *
 *   #app has no explicit height in the game's CSS (just display:flex). Phaser
 *   measures it via getBoundingClientRect() which returns height:0 for a flex
 *   container with no content yet. Phaser then falls back to measuring the
 *   document/window for height, but the interaction between body padding-top
 *   (added by the notch-fix patch), Capacitor's edge-to-edge WebView, and the
 *   flex container means Phaser ends up fitting to WIDTH rather than HEIGHT —
 *   stretching the canvas across the full screen and clipping the bottom.
 *
 *   Modern phones in landscape are ~2.17:1 (e.g. iPhone 15 Pro: 852x393px).
 *   The game is 1.78:1 (16:9). The screen is WIDER than the game, so fitting
 *   to HEIGHT is correct — this leaves black bars on the sides where the dpad
 *   and apad controls naturally sit, exactly as PokeRogue displays it.
 *
 * Fix:
 *   In landscape, explicitly size #app to:
 *     height: 100dvh                     (fill screen height)
 *     width:  calc(100dvh * 16 / 9)      (exact game aspect ratio)
 *     centered horizontally in the viewport
 *
 *   Phaser now reads a container that is exactly the game's aspect ratio.
 *   FIT mode scales the canvas to fill it precisely — full height, correct
 *   width, centered — with the browser rendering black bars on either side.
 *
 *   The notch-fix body padding-top is also reset to 0 in landscape since the
 *   notch inset moves to the sides (not the top) in landscape orientation.
 *
 *   Portrait behaviour is completely unchanged.
 *
 * Targets: pokevoid-src/dist/index.html
 */

const fs = require("fs");
const path = require("path");

const TARGET = path.join("pokevoid-src", "dist", "index.html");

if (!fs.existsSync(TARGET)) {
  console.error(`ERROR: Could not find target file: ${TARGET}`);
  console.error("Make sure this runs after the build step (dist/ must exist).");
  process.exit(1);
}

let src = fs.readFileSync(TARGET, "utf8");

const MARKER = "capacitor-canvas-fit-fix";

if (src.includes(MARKER)) {
  console.log("Canvas fit fix already present, skipping.");
  process.exit(0);
}

if (!src.includes("</head>")) {
  console.error("ERROR: Could not find </head> in index.html.");
  process.exit(1);
}

// Clean up any previous versions of this patch.
src = src.replace(/<style id="capacitor-landscape-canvas-fix">[\s\S]*?<\/style>\s*/g, "");
src = src.replace(/<style id="capacitor-canvas-fit-fix">[\s\S]*?<\/style>\s*/g, "");

const STYLE_BLOCK = `
  <style id="${MARKER}">
    /*
     * Landscape letterbox fix.
     *
     * Give #app explicit dimensions matching the game's 16:9 aspect ratio,
     * anchored to screen height. Phaser FIT then fills it exactly, and the
     * browser draws black bars on the sides — controls sit in those bars.
     *
     * Also reset body padding-top to 0: in landscape the notch inset moves
     * to the left/right sides, not the top, so top padding is unwanted.
     */
    @media (orientation: landscape) {
      body {
        padding-top: 0 !important;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100dvw;
        height: 100dvh;
        overflow: hidden;
      }

      #app {
        height: 100dvh;
        width: calc(100dvh * 16 / 9);
        flex-shrink: 0;
        overflow: hidden;
      }
    }
  </style>`;

const patched = src.replace("</head>", `${STYLE_BLOCK}\n</head>`);

if (patched === src) {
  console.error("ERROR: Replacement produced no change.");
  process.exit(1);
}

fs.writeFileSync(TARGET, patched, "utf8");
console.log(`Injected canvas fit fix into ${TARGET}`);
console.log("Canvas fit fix applied successfully.");