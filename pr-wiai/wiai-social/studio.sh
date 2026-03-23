#!/usr/bin/env bash
# Start Remotion Studio for wiai-social
cd "$(dirname "$0")"
npx remotion preview src/index.ts
