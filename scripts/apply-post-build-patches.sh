#!/bin/bash
set -e
# apply-post-build-patches.sh — post-build patches (run after pnpm build, targeting dist/)
#
# Usage:
#   ./apply-post-build-patches.sh            # all platforms (default)
#   ./apply-post-build-patches.sh mobile     # all + mobile (iOS + Android)
#   ./apply-post-build-patches.sh android    # all + mobile + android
#   ./apply-post-build-patches.sh appimage   # all + desktop
#   ./apply-post-build-patches.sh exe        # all + desktop

PLATFORM="${1:-all}"

source "$(dirname "$0")/patch-lib.sh"

# ── Mobile (iOS + Android) ────────────────────────────────────────────────────
if [[ "$PLATFORM" == "mobile" || "$PLATFORM" == "android" ]]; then

  apply_patch "notch-fix.js"               mobile
  apply_patch "capacitor-browser.js"       mobile
  apply_patch "champion-select-c-button.js" mobile
  apply_patch "landscape-canvas-fit.js"    mobile

fi

echo "All post-build patches applied successfully (platform: $PLATFORM)."
