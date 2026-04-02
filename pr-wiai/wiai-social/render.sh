#!/usr/bin/env bash
set -euo pipefail

INPUT="${1:?Usage: ./render.sh posts/post-id.json  (or just the post ID)}"
# Normalize: accept bare ID, ID.json, or posts/ID.json
POST_ID=$(basename "$INPUT" .json)
POST_JSON="posts/$POST_ID.json"
if [[ ! -f "$POST_JSON" ]]; then
  echo "Error: $POST_JSON not found" >&2
  exit 1
fi
OUT_DIR="./out"
mkdir -p "$OUT_DIR"

echo "Rendering: $POST_ID"

# ── Sync Root.tsx with active posts ────────────────────────────────────────
node "$(dirname "$0")/../sync-root.mjs" --quiet

# ── Compute still frames from post timing ───────────────────────────────────
read S1A S1B S2A S2B S3F <<< $(node -e '
const post = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const c = post.content || {};
const t = post.timing || {};

const act1 = t.act1Duration ?? (c.act1Reveal ? 150 : 100);

// replicate computeAct2Duration (timing.ts defaults: startFrame=10, fpl=3, buffer=130)
const lines = (c.act2 || "").split("\n");
const fpl = 3;
const twF = lines.reduce((s, l) => s + (l.trim() === "" ? fpl * 2 : fpl), 0);
const act2 = Math.max(90, 10 + twF + 130);

const act3Start = act1 + act2;
const variant = t.variant || "scratch";
const total = t.totalDuration ? t.totalDuration : variant === "through" ? 520 : act3Start + 295;
const act3Dur = total - act3Start;
const absStart = t.absenderStartFrame ?? (act3Dur < 250 ? Math.min(120, act3Dur - 70) : 155);

// S1: setup text only → setup + reveal (reveal fades in at local 75-90)
const s1a = 30;
const s1b = Math.min(act1 - 15, 130);
// S2: card with main text → card with punchline visible
const s2a = act1 + 30;
const s2b = act1 + act2 - 20;
// S3: footer fully visible (absender fade takes 30f)
const s3 = Math.min(act3Start + absStart + 40, total - 20);

process.stdout.write([s1a, s1b, s2a, s2b, s3].join(" "));
' "$POST_JSON")

echo "Still frames: S1a=$S1A S1b=$S1B S2a=$S2A S2b=$S2B S3=$S3F"

# ── 1. Render video with audio ──────────────────────────────────────────────
npx remotion render src/index.ts "WiaiPost-$POST_ID" \
  --output="$OUT_DIR/$POST_ID.mp4" \
  --codec=h264 \
  --crf=18 \
  --pixel-format=yuv420p

# ── 2. Slide stills 1080×1920 (start + end state per act) ───────────────────
STILL_FRAMES=("$S1A" "$S1B" "$S2A" "$S2B" "$S3F")
STILL_NAMES=(s1a s1b s2a s2b s3)

for i in "${!STILL_NAMES[@]}"; do
  npx remotion still src/index.ts "WiaiPost-$POST_ID" \
    --frame="${STILL_FRAMES[$i]}" \
    --output="$OUT_DIR/$POST_ID-${STILL_NAMES[$i]}.png"
done

# ── 3. Carousel crops 1080×1350 (end-state stills only) ─────────────────────
for SUFFIX in s1b s2b s3; do
  node crop.mjs \
    "$OUT_DIR/$POST_ID-${SUFFIX}.png" \
    "$OUT_DIR/$POST_ID-carousel-${SUFFIX}.png"
done

echo ""
echo "Done! Output:"
ls -lh "$OUT_DIR/$POST_ID"*
