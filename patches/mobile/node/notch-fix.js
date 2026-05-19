#!/usr/bin/env node
/**
 * Patch: notch-fix.js
 *
 * Fixes content rendering under the status bar on iOS and Android in portrait.
 *
 * Root cause:
 *   The WebView draws behind the status bar (edge-to-edge), so game content
 *   starts at y=0 and is obscured by the status bar in portrait mode.
 *
 * Why not CSS:
 *   Injecting a <style> tag into <head> triggers a synchronous style
 *   recalculation before Phaser reads window dimensions at init time. This
 *   causes Phaser to measure incorrect values in landscape, producing a
 *   tiny/wrongly-scaled canvas. Even portrait-only media queries cause this
 *   because the CSSOM change itself affects layout timing.
 *
 * Fix:
 *   Apply the padding-top via JavaScript AFTER the window 'load' event, by
 *   which point Phaser has already read dimensions and initialised its scale.
 *   The JS only runs in portrait orientation, so landscape is never affected.
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

if (src.includes('id="capacitor-notch-fix"')) {
  console.log("Notch fix already present, skipping.");
  process.exit(0);
}

if (!src.includes("</body>")) {
  console.error("ERROR: Could not find </body> in index.html.");
  process.exit(1);
}

const SCRIPT_BLOCK = `
  <script id="capacitor-notch-fix">
    // Apply portrait notch/status-bar offset via JS after Phaser has initialised.
    // Using CSS for this (even portrait-only media queries) causes a synchronous
    // CSSOM recalculation that corrupts Phaser's initial dimension measurement in
    // landscape, resulting in a tiny or wrongly-scaled canvas.
    (function () {
      function applyNotchPadding() {
        if (window.matchMedia("(orientation: portrait)").matches) {
          var inset = parseInt(
            getComputedStyle(document.documentElement)
              .getPropertyValue("--sat") || "0",
            10
          );
          // Fall back to env() via a temporary element if custom property unavailable
          var el = document.createElement("div");
          el.style.cssText =
            "position:fixed;top:env(safe-area-inset-top,0px);left:0;width:1px;height:1px;";
          document.body.appendChild(el);
          var top = el.getBoundingClientRect().top;
          document.body.removeChild(el);
          if (top > 0) {
            document.body.style.paddingTop = top + "px";
            document.body.style.boxSizing = "border-box";
          }
        } else {
          // Remove any portrait padding when in landscape
          document.body.style.paddingTop = "";
          document.body.style.boxSizing = "";
        }
      }

      // Run after full load so Phaser has already initialised and measured dimensions
      window.addEventListener("load", function () {
        // Small delay to ensure Phaser's ScaleManager has completed its first layout
        setTimeout(applyNotchPadding, 100);
      });

      // Re-apply on orientation change
      window.addEventListener("orientationchange", function () {
        setTimeout(applyNotchPadding, 300);
      });
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener("change", function () {
          setTimeout(applyNotchPadding, 300);
        });
      }
    })();
  </script>`;

// Inject before </body> so it runs after the page structure is ready
const patched = src.replace("</body>", `${SCRIPT_BLOCK}\n</body>`);

if (patched === src) {
  console.error("ERROR: Replacement produced no change.");
  process.exit(1);
}

fs.writeFileSync(TARGET, patched, "utf8");
console.log(`Injected notch fix script into ${TARGET}`);
console.log("Notch fix applied successfully.");