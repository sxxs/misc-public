import React from "react";
import { Sequence, useCurrentFrame, Audio, staticFile, interpolate } from "remotion";
import type { Post, DokuScene, DokuWordCaption } from "../types";
import { BLACK } from "../styles/colors";
import { spaceMonoFamily } from "../styles/fonts";
import { scanlineGradient } from "../styles/textures";
import { crtFlicker, resolveDokuColor } from "../components/doku/common";
import { TextScreenScene } from "../components/doku/TextScreen";
import { StatusLogScene } from "../components/doku/StatusLog";
import { LogCrawlScene } from "../components/doku/LogCrawl";
import { TimelineScene } from "../components/doku/Timeline";
import { DualBoxScene } from "../components/doku/DualBox";
import { IntCounterScene } from "../components/doku/IntCounter";
import { AftermathScene } from "../components/doku/Aftermath";
import { OutroCardScene } from "../components/doku/OutroCard";

// ── Scene dispatcher ───────────────────────────────────────────────────────
// Remotion <Sequence> already gives each child its own zero-based useCurrentFrame.
// Each scene component reads its own local frame and renders accordingly.
const renderScene = (scene: DokuScene): React.ReactNode => {
  switch (scene.kind) {
    case "text-screen":  return <TextScreenScene scene={scene} />;
    case "status-log":   return <StatusLogScene scene={scene} />;
    case "log-crawl":    return <LogCrawlScene scene={scene} />;
    case "timeline":     return <TimelineScene scene={scene} />;
    case "dual-box":     return <DualBoxScene scene={scene} />;
    case "int-counter":  return <IntCounterScene scene={scene} />;
    case "aftermath":    return <AftermathScene scene={scene} />;
    case "outro-card":   return <OutroCardScene scene={scene} />;
    default: {
      const _exhaustive: never = scene;
      return null;
    }
  }
};

// ── Outer frame: solid black + subtle CRT scanlines (0.06) ─────────────────
const DokuFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, background: BLACK }}>
    {children}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: scanlineGradient(0.06),
        pointerEvents: "none",
      }}
    />
  </div>
);

// ── Channel tag: tiny "@echt.bamberg" bottom-right ─────────────────────────
const ChannelTag: React.FC<{ tag: string }> = ({ tag }) => (
  <div style={{
    position: "absolute",
    right: 64, bottom: 90,
    fontFamily: spaceMonoFamily,
    fontSize: 22,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.5,
    pointerEvents: "none",
  }}>
    {tag}
  </div>
);

// ── Inter-scene CRT flicker overlay ────────────────────────────────────────
// Renders a thin black-overlay flash at every scene cut for `dur` frames.
// We compute cumulative scene start-frames and apply opacity inversely to crtFlicker.
const FlickerOverlay: React.FC<{ cutFrames: number[]; dur?: number }> = ({ cutFrames, dur = 4 }) => {
  const frame = useCurrentFrame();
  // Find the closest preceding cut
  let dim = 1;
  for (const cut of cutFrames) {
    if (frame < cut) break;
    dim = Math.min(dim, crtFlicker(frame, cut, dur));
  }
  if (dim >= 1) return null;
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: BLACK,
      opacity: 1 - dim,
      pointerEvents: "none",
    }} />
  );
};

// ── Word-chunk captions — synced to narration timestamps ───────────────────
// Each chunk appears at its frame and holds until the next chunk starts.
// Positioned just below the safe-zone content (y≈1320), with a dark pill background.

const WordCaptionOverlay: React.FC<{ chunks: DokuWordCaption[]; totalFrames: number }> = ({ chunks, totalFrames }) => {
  const frame = useCurrentFrame();
  if (!chunks.length) return null;

  // Find active chunk: last chunk whose frame <= current frame
  let active: DokuWordCaption | null = null;
  let nextFrame = totalFrames;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].frame <= frame) {
      active = chunks[i];
      nextFrame = chunks[i + 1]?.frame ?? totalFrames;
    }
  }
  if (!active) return null;

  // Fade in quickly, fade out near end of chunk
  const localT = frame - active.frame;
  const chunkDur = nextFrame - active.frame;
  const fadeIn = Math.min(1, localT / 4);
  const fadeOut = chunkDur > 10 ? Math.min(1, (chunkDur - localT) / 6) : 1;
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div style={{
      position: "absolute",
      top: 1320,
      left: 0, right: 0,
      display: "flex", justifyContent: "center",
      pointerEvents: "none",
      opacity,
    }}>
      <div style={{
        fontFamily: spaceMonoFamily,
        fontSize: 36,
        fontWeight: 600,
        color: "rgba(255,255,255,0.95)",
        letterSpacing: 0.5,
        lineHeight: 1.3,
        textAlign: "center",
        backgroundColor: "rgba(0,0,0,0.82)",
        borderRadius: 6,
        padding: "8px 28px",
        maxWidth: 820,
      }}>
        {active.text}
      </div>
    </div>
  );
};

// ── Music envelope ────────────────────────────────────────────────────────
// Intro loud → body gently ducked during narration → outro rises back.
// No per-word pumping: narration start/end are derived from the first/last
// caption chunk, and the transitions are long (2–3s) so they're inaudible.
const VOL_INTRO  = 0.72;   // before narration starts
const VOL_BODY   = 0.30;   // under narration (subtle duck, not silence)
const VOL_OUTRO  = 0.72;   // after narration ends
const RAMP_F     = 75;     // 2.5s transition — imperceptibly slow

function buildDuckingVolumeFn(chunks: DokuWordCaption[], totalFrames: number): (f: number) => number {
  if (!chunks.length) return () => VOL_INTRO;

  const speechStart = chunks[0].frame;
  // Estimate narration end from last chunk + its spoken duration
  const lastChunk = chunks[chunks.length - 1];
  const estLastDur = Math.max(18, Math.round(lastChunk.text.replace(/ /g, "").length * 1.8));
  const speechEnd = lastChunk.frame + estLastDur;

  return (frame: number): number => {
    // Global fade-in (first 15f) and fade-out (last 45f)
    const globalFade = Math.min(
      interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
      interpolate(frame, [totalFrames - 45, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    );

    let vol: number;
    if (frame < speechStart - RAMP_F) {
      vol = VOL_INTRO;
    } else if (frame < speechStart) {
      vol = interpolate(frame, [speechStart - RAMP_F, speechStart], [VOL_INTRO, VOL_BODY], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    } else if (frame <= speechEnd) {
      vol = VOL_BODY;
    } else if (frame < speechEnd + RAMP_F) {
      vol = interpolate(frame, [speechEnd, speechEnd + RAMP_F], [VOL_BODY, VOL_OUTRO], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    } else {
      vol = VOL_OUTRO;
    }

    return vol * globalFade;
  };
}

// ── Main composition ───────────────────────────────────────────────────────
export const TerminalDoku: React.FC<{ post: Post }> = ({ post }) => {
  const doku = post.doku;
  if (!doku) return <DokuFrame><div /></DokuFrame>;

  // Compute cumulative scene starts
  const starts: number[] = [];
  let acc = 0;
  for (const scene of doku.scenes) {
    starts.push(acc);
    acc += scene.durationFrames;
  }

  const lastScene = doku.scenes.length - 1;
  const channelTagShown = (frame: number): boolean => {
    if (!doku.channelTag) return false;
    return frame >= starts[lastScene];
  };

  const totalFrames = starts[doku.scenes.length - 1] + doku.scenes[doku.scenes.length - 1].durationFrames;

  const cutFrames = doku.flickerBetweenScenes !== false
    ? starts.slice(1)
    : [];

  return (
    <DokuFrame>
      {doku.narrationFile && (
        <Audio src={staticFile(doku.narrationFile)} />
      )}
      {doku.musicFile && (
        <Audio
          src={staticFile(doku.musicFile)}
          loop
          volume={doku.wordCaptions
            ? buildDuckingVolumeFn(doku.wordCaptions, totalFrames)
            : FULL_VOL * 0.5}
        />
      )}
      {doku.scenes.map((scene, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={scene.durationFrames}>
          {renderScene(scene)}
        </Sequence>
      ))}
      <FlickerOverlay cutFrames={cutFrames} />
      {doku.wordCaptions && (
        <WordCaptionOverlay chunks={doku.wordCaptions} totalFrames={totalFrames} />
      )}
      {doku.channelTag && (
        <ConditionalChannelTag tag={doku.channelTag} fromFrame={starts[lastScene]} />
      )}
    </DokuFrame>
  );
};

const ConditionalChannelTag: React.FC<{ tag: string; fromFrame: number }> = ({ tag, fromFrame }) => {
  const frame = useCurrentFrame();
  if (frame < fromFrame) return null;
  return <ChannelTag tag={tag} />;
};
