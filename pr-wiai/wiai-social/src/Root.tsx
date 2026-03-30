import React from "react";
import { Composition } from "remotion";
import { WiaiPost } from "./compositions/WiaiPost";
import { Post } from "./types";
import {
  computeAct2Duration,
  ACT3_ALT_TRACKS,
  computeBillboardDuration,
  computeTerminalDuration,
  computeBillboardCaptionDuration,
  computeTerminalFlowDuration,
  computeSlideshowDuration,
} from "./utils/timing";

// ── Post imports ──────────────────────────────────────────────────────────────
import samplePost from "../posts/archive/prelaunch/2026-mathe3.json";
// @export-post:imports-end

// ── Duration helpers ──────────────────────────────────────────────────────────
const TRACK_DURATION = 520; // track.mp3 ~17.3s at 30fps

const ledWallDuration = (post: Post) => {
  const act1 = post.timing?.act1Duration ?? (post.content.act1Reveal ? 150 : 100);
  if (post.timing?.variant === "through") return TRACK_DURATION;
  const alt = post.timing?.act3Track ? ACT3_ALT_TRACKS[post.timing.act3Track] : null;
  const delay = post.timing?.act3MusicDelay ?? 0;
  const act3 = alt ? alt.dur + delay : 295;
  return act1 + computeAct2Duration(post.content.act2) + act3;
};

// ── Composition factories ─────────────────────────────────────────────────────
const C = WiaiPost as unknown as React.ComponentType<Record<string, unknown>>;
const S = { fps: 30, width: 1080, height: 1920 }; // screen spec

// Duration dispatch by post type
const selectDuration = (post: Post): number => {
  if (post.type === "billboard") {
    if (post.billboard?.mode === "captions" && post.billboard.captions) {
      return computeBillboardCaptionDuration(post.billboard.captions);
    }
    return computeBillboardDuration(post);
  }
  if (post.type === "terminal") {
    if (post.terminal?.mode === "flow" && post.terminal.blocks) {
      return computeTerminalFlowDuration(post.terminal.blocks);
    }
    return computeTerminalDuration(post);
  }
  if (post.type === "slideshow" && post.slideshow) {
    return computeSlideshowDuration(post.slideshow);
  }
  return ledWallDuration(post); // led-wall + all legacy types
};

// cp: register a post — duration computed from JSON
const cp = (id: string, post: Post) => (
  <Composition key={id} id={id} component={C}
    durationInFrames={selectDuration(post)} {...S}
    defaultProps={post as unknown as Record<string, unknown>} />
);

// ══════════════════════════════════════════════════════════════════════════════
// To add a new post:
//   1. node export-post.mjs <post-id>   (creates JSON + adds import/cp below)
//   2. npm run preview                  (check in Remotion Studio)
//   3. ./render.sh posts/<id>.json      (render video + stills + carousel)
// ══════════════════════════════════════════════════════════════════════════════

export const Root: React.FC = () => (
  <>
    {/* ── Fallback composition — Studio preview with sample post ────────── */}
    <Composition id="WiaiPost" component={C} durationInFrames={450} {...S}
      defaultProps={samplePost as unknown as Post} />

    {/* ── Active posts ──────────────────────────────────────────────────── */}
    {cp("WiaiPost-sample", samplePost as unknown as Post)}
    {/* @export-post:compositions-end */}
  </>
);
