#!/usr/bin/env bash
set -euo pipefail
# Archive a posted post: move JSON to posts/archive/ and renders to out/archive/
# Usage: ./archive-post.sh <post-id>
#        ./archive-post.sh 2026-informatik-trocken

POST_ID="${1:?Usage: ./archive-post.sh <post-id>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
POSTS_DIR="$SCRIPT_DIR/posts"
OUT_DIR="$SCRIPT_DIR/out"

JSON_FILE="$POSTS_DIR/$POST_ID.json"
if [ ! -f "$JSON_FILE" ]; then
  echo "Not found: $JSON_FILE"
  exit 1
fi

# ── Archive JSON ──────────────────────────────────────────────────────────────
mkdir -p "$POSTS_DIR/archive/posted"
mv "$JSON_FILE" "$POSTS_DIR/archive/posted/"
echo "Archived: posts/$POST_ID.json → posts/archive/posted/"

# ── Archive renders ───────────────────────────────────────────────────────────
RENDERS=("$OUT_DIR"/$POST_ID*)
if [ -e "${RENDERS[0]}" ]; then
  mkdir -p "$OUT_DIR/archive"
  mv "$OUT_DIR"/$POST_ID* "$OUT_DIR/archive/"
  echo "Archived: out/$POST_ID* → out/archive/"
else
  echo "No renders found in out/ (skipped)"
fi

# ── Sync Root.tsx ─────────────────────────────────────────────────────────────
node "$SCRIPT_DIR/../sync-root.mjs" --quiet
echo "Root.tsx synced (post removed)"
echo ""
echo "To restore later: cp posts/archive/posted/$POST_ID.json posts/ && node ../sync-root.mjs"
