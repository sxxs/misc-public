#!/usr/bin/env bash
# Start Planning Dashboard + Remotion Studio
cd "$(dirname "$0")"

echo "Starting Planning Dashboard → http://localhost:3847"
node pipeline/server.mjs &
PID_DASHBOARD=$!

echo "Starting Remotion Studio…"
cd wiai-social && npx remotion preview src/index.ts &
PID_STUDIO=$!

trap "kill $PID_DASHBOARD $PID_STUDIO 2>/dev/null" EXIT
wait
