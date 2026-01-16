#!/bin/bash
set -euo pipefail

REMOTE="root@bew"
DOCROOT="/var/www/wiai25.de"
LOCAL_DIR="$(dirname "$0")"
cd "$LOCAL_DIR"

DRY_RUN=""
[[ "${1:-}" == "-n" ]] && DRY_RUN="1"

# 1. Aktuelles Frame vom Server holen
echo "Fetching current frame from server..."
CURRENT_FRAME=$(curl -sf "https://wiai25.de/wiai.json" | jq -r '.total // 0')
echo "Current frame: $CURRENT_FRAME"

# 2. defaultFrame in index.html aktualisieren
echo "Updating defaultFrame in index.html..."
sed -i '' "s/defaultFrame: [0-9]*/defaultFrame: $CURRENT_FRAME/" index.html
grep "defaultFrame:" index.html

# 3. Tailwind CSS bauen
echo "Building Tailwind CSS..."
npm run build:css

# 4. rsync zum Server
EXCLUDES="--exclude=node_modules --exclude=package*.json --exclude=tailwind.config.js"
EXCLUDES="$EXCLUDES --exclude=input.css --exclude=current.json --exclude=.gitignore"
EXCLUDES="$EXCLUDES --exclude=deploy.sh --exclude=.DS_Store"

echo "Syncing to server..."
if [[ -n "$DRY_RUN" ]]; then
    rsync -avz --checksum --delete --dry-run $EXCLUDES ./ "$REMOTE:$DOCROOT/"
else
    rsync -avz --checksum --delete $EXCLUDES ./ "$REMOTE:$DOCROOT/"

    # 5. Ownership fixen
    echo "Fixing ownership..."
    ssh "$REMOTE" "chown -R caddy:caddy $DOCROOT"
fi

echo "Done."
