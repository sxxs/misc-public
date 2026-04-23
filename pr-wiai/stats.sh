#!/usr/bin/env bash
set -euo pipefail
# Refresh YT engagement data + show ranked comparison.
# Daily/weekly entry point — analogous to digest.sh for content pipeline status.

cd "$(dirname "$0")"

node pipeline/metrics.mjs yt analytics-all
echo
node pipeline/metrics.mjs yt rank
