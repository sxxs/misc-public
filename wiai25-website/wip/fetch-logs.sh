#!/bin/bash
set -euo pipefail

REMOTE="root@bew"
LOG_FILE="/var/log/caddy/wiai25.de.log"
LOCAL_DIR="$(dirname "$0")/logs"
DATE=$(date +%Y-%m-%d)

mkdir -p "$LOCAL_DIR"

echo "Fetching logs..."
scp "$REMOTE:$LOG_FILE" "$LOCAL_DIR/wiai25-$DATE.log"

# Optional: Komprimieren
gzip -f "$LOCAL_DIR/wiai25-$DATE.log"

echo "Saved to $LOCAL_DIR/wiai25-$DATE.log.gz"
