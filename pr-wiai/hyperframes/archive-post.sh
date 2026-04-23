#!/usr/bin/env bash
set -euo pipefail
# Archive a published Hyperframes composition.
# Moves hyperframes/<id>/ → hyperframes/archive/<id>/ atomically.
# Usage: ./archive-post.sh <composition-id>
#        ./archive-post.sh stadtspaziergang

COMP="${1:?Usage: ./archive-post.sh <composition-id>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SCRIPT_DIR/$COMP"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
DST="$ARCHIVE_DIR/$COMP"

if [ ! -d "$SRC" ]; then
  echo "Not found: $SRC"
  exit 1
fi

if [ -d "$DST" ]; then
  echo "Already archived: $DST"
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"
mv "$SRC" "$DST"

# Drop a manifest so future readers can reconstruct what this was
cat > "$DST/ARCHIVED.md" <<EOF
# $COMP

Archived: $(date +%Y-%m-%d)

Contents:
$(ls -1 "$DST" | sed 's/^/- /')

See plan.json for social copy and posting dates.
To restore: mv hyperframes/archive/$COMP hyperframes/$COMP
EOF

echo "✓ Archived: hyperframes/$COMP → hyperframes/archive/$COMP"
echo "  Manifest: hyperframes/archive/$COMP/ARCHIVED.md"
echo "  To restore: mv hyperframes/archive/$COMP hyperframes/$COMP"
