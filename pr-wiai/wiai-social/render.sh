#!/usr/bin/env bash
set -euo pipefail

POST_JSON="${1:?Usage: ./render.sh posts/post-id.json}"
POST_ID=$(basename "$POST_JSON" .json)
OUT_DIR="./out"
mkdir -p "$OUT_DIR"

echo "Rendering: $POST_ID"

# 1. Render video (duration from Root.tsx composition registration)
npx remotion render src/index.ts "WiaiPost-$POST_ID" \
  --output="$OUT_DIR/$POST_ID.mp4" \
  --codec=h264 \
  --crf=18 \
  --pixel-format=yuv420p \
  --muted

# 2. Story stills 1080x1920 (frames: 60=slide1, 200=slide2, 390=slide3)
for SLIDE in 1 2 3; do
  case $SLIDE in
    1) FRAME=60 ;;
    2) FRAME=200 ;;
    3) FRAME=390 ;;
  esac
  npx remotion still src/index.ts "WiaiPost-$POST_ID" \
    --frame="$FRAME" \
    --output="$OUT_DIR/$POST_ID-slide${SLIDE}.png"
done

# 3. Carousel crops 1080x1350
for SLIDE in 1 2 3; do
  node crop.mjs \
    "$OUT_DIR/$POST_ID-slide${SLIDE}.png" \
    "$OUT_DIR/$POST_ID-carousel${SLIDE}.png"
done

echo ""
echo "Done! Output:"
ls -lh "$OUT_DIR/$POST_ID"*
