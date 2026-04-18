#!/usr/bin/env node
/**
 * Patch: capacitor-browser.js
 *
 * Fixes external links (Discord, Wiki, community URLs) in Capacitor native builds.
 *
 * Problem:
 *   In a Capacitor WebView, window.open(..., "_blank") is intercepted and either
 *   silently dropped or opens inside the WebView itself (breaking the game).
 *   iOS and Android both require the system browser to be opened via the
 *   Capacitor Browser plugin instead.
 *
 * Solution:
 *   Inject a small script into dist/index.html that overrides window.open on
 *   native platforms to use window.Capacitor.Plugins.Browser.open() instead.
 *   On web builds, window.open is left completely untouched.
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

if (src.includes("capacitor-browser-fix")) {
  console.log("Capacitor browser fix already present, skipping.");
  process.exit(0);
}

if (!src.includes("</head>")) {
  console.error("ERROR: Could not find </head> in index.html.");
  process.exit(1);
}

const SCRIPT_BLOCK = `
  <script id="capacitor-browser-fix">
    // On Capacitor native builds, window.open() is silently swallowed by the
    // WebView. Override it to use the Capacitor Browser plugin instead so that
    // external links (Discord, Wiki, community URLs) open in the system browser.
    (function () {
      var _nativeOpen = window.open.bind(window);
      window.open = function (url, target, features) {
        var cap = window.Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform() && url && /^https?:\/\//.test(url)) {
          var Browser = cap.Plugins && cap.Plugins.Browser;
          if (Browser && Browser.open) {
            Browser.open({ url: url });
            return null;
          }
        }
        return _nativeOpen(url, target, features);
      };
    })();
  </script>`;

const patched = src.replace("</head>", `${SCRIPT_BLOCK}\n</head>`);

if (patched === src) {
  console.error("ERROR: Replacement produced no change.");
  process.exit(1);
}

fs.writeFileSync(TARGET, patched, "utf8");
console.log(`Injected Capacitor browser override into ${TARGET}`);
console.log("Capacitor browser fix applied successfully.");