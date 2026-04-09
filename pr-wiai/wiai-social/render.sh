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
const term = post.terminal || {};

// ── Terminal posts use terminal.* for timing ────────────────────────────
if (post.type === "terminal") {
  const act1 = term.act1Duration ?? 75;
  const chars = (c.act2 || "").replace(/\n/g, "").length;
  const cpf = term.charsPerFrame ?? 0.5;
  const act2 = term.act2Duration ?? Math.max(90, 6 + Math.ceil(chars / cpf) + Math.floor(chars / 8) + 60);
  const act3 = term.act3Duration ?? 150;
  const total = act1 + act2 + act3;
  const s1a = Math.min(Math.floor(act1 * 0.3), act1 - 5);
  const s1b = Math.min(act1 - 5, act1 - 1);
  const s2a = act1 + Math.floor(act2 * 0.4);
  const s2b = act1 + act2 - 5;
  const s3  = Math.min(act1 + act2 + act3 - 10, total - 5);
  process.stdout.write([s1a, s1b, s2a, s2b, s3].join(" "));
  process.exit(0);
}

// ── Billboard posts use billboard.* for timing ─────────────────────────
if (post.type === "billboard") {
  const bb = post.billboard || {};
  const act1 = bb.act1Duration ?? 120;
  let act2;
  if (bb.act2Duration) { act2 = bb.act2Duration; }
  else {
    const ls2 = (c.act2 || "").split("\\n");
    const f2 = 3;
    act2 = Math.max(90, 10 + ls2.reduce((s, l) => s + (l.trim() === "" ? f2*2 : f2), 0) + 130);
  }
  const act3 = bb.act3Duration ?? 160;
  const total = act1 + act2 + act3;
  const s1a = Math.min(30, act1 - 5);
  const s1b = Math.min(act1 - 10, act1 - 1);
  const s2a = act1 + Math.min(30, Math.floor(act2 * 0.3));
  const s2b = act1 + act2 - 10;
  const s3  = Math.min(act1 + act2 + Math.floor(act3 * 0.6), total - 5);
  process.stdout.write([s1a, s1b, s2a, s2b, s3].join(" "));
  process.exit(0);
}

// ── Nachtgedanke posts use nachtgedanke.* for timing ──────────────────
if (post.nachtgedanke) {
  const nk = post.nachtgedanke;
  const blocks = nk.blocks || [];
  const lastBlock = blocks[blocks.length - 1];
  const punchlineStart = lastBlock ? lastBlock.at + lastBlock.hold + 5 : 80;
  const total = punchlineStart + (nk.punchlineDuration ?? 95);
  // S1a: zoom hold phase (phone + overthinking label)
  const s1a = 30;
  // S1b: first block with reveal visible
  const b0 = blocks[0];
  const s1b = b0 ? b0.at + (b0.revealDelay ? b0.revealDelay + 12 : Math.floor(b0.hold * 0.6)) : 80;
  // S2a/S2b: second block (or late first block)
  const b1 = blocks.length > 1 ? blocks[1] : null;
  const s2a = b1 ? b1.at + Math.min(15, Math.floor(b1.hold * 0.3)) : punchlineStart + 10;
  const s2b = b1 ? b1.at + b1.hold - 5 : punchlineStart + 20;
  // S3: punchline
  const s3 = Math.min(punchlineStart + Math.floor((nk.punchlineDuration ?? 95) * 0.6), total - 5);
  process.stdout.write([s1a, s1b, s2a, s2b, s3].join(" "));
  process.exit(0);
}

// ── LED-wall (default) ─────────────────────────────────────────────────
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
