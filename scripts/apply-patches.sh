#!/bin/bash
set -e
# apply-patches.sh — pre-build patches
#
# Usage:
#   ./apply-patches.sh            # all platforms (default)
#   ./apply-patches.sh mobile     # all + mobile (iOS + Android)
#   ./apply-patches.sh android    # all + mobile + android
#   ./apply-patches.sh appimage   # all + desktop
#   ./apply-patches.sh exe        # all + desktop

PLATFORM="${1:-all}"

source "$(dirname "$0")/patch-lib.sh"

# ── All platforms ─────────────────────────────────────────────────────────────

apply_patch "remove-pokesave.js"      all
apply_patch "inject-build-number.js"  all

# ── Mobile (iOS + Android) ────────────────────────────────────────────────────
if [[ "$PLATFORM" == "mobile" || "$PLATFORM" == "android" ]]; then

  apply_patch "noZoom.js"                        mobile
  apply_patch "pokevoid-capacitor-export-fix.js" mobile

fi

# ── Android only ──────────────────────────────────────────────────────────────
if [[ "$PLATFORM" == "android" ]]; then

  # android-specific patches go here

fi

echo "All patches applied successfully (platform: $PLATFORM)."
