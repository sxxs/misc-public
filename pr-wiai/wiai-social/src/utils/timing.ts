export interface TypewriterLine {
  text: string;
  isBlank: boolean;
}

export function parseTypewriterLines(text: string): TypewriterLine[] {
  return text.split("\n").map((line) => ({
    text: line,
    isBlank: line.trim() === "",
  }));
}

// framesPerLine: frames to wait before revealing the next line.
// Blank lines (paragraph breaks) get 2× the delay.
export function getVisibleLineCount(
  lines: TypewriterLine[],
  localFrame: number,
  startFrame = 10,
  framesPerLine = 3
): number {
  let cursor = startFrame;
  for (let i = 0; i < lines.length; i++) {
    const delay = lines[i].isBlank ? framesPerLine * 2 : framesPerLine;
    if (localFrame < cursor) return i;
    cursor += delay;
  }
  return lines.length;
}

// Compute how many frames Act2 needs for a given text at given speed + reading buffer.
export function computeAct2Duration(
  text: string,
  startFrame = 10,
  framesPerLine = 3,
  readingBuffer = 130
): number {
  const lines = parseTypewriterLines(text);
  const typewriterFrames = lines.reduce(
    (sum, line) => sum + (line.isBlank ? framesPerLine * 2 : framesPerLine),
    0
  );
  return Math.max(90, startFrame + typewriterFrames + readingBuffer);
}

// Compute how many frames Act3 needs based on text length.
// Formula: max(150, 150 + 4f/punchline-word + 3f/button-word)
// → "Merkste selber, oder?" (3w) + 13-word button ≈ 201f
// → 5-word punchline + 4-word button ≈ 182f
// → 3-word punchline, no button ≈ 162f
export function computeAct3Duration(
  punchlineText: string,
  buttonText?: string,
  übrigensText?: string
): number {
  const pWords = punchlineText.trim().split(/\s+/).filter(Boolean).length;
  const bWords = (buttonText ?? übrigensText ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(150, 150 + pWords * 4 + bWords * 3);
}

// Alt Act3 tracks — dur ends on drum roll (~1.5s / 45f before track end)
// Add new entries here; Contrarian.tsx + Root.tsx both import this
export const ACT3_ALT_TRACKS: Record<string, { file: string; dur: number }> = {
  a: { file: "music/track-act3-a.mp3", dur: 411 }, // 15.19s → 456f - 45
  b: { file: "music/track-act3-b.mp3", dur: 430 }, // 15.82s → 475f - 45
  c: { file: "music/track-act3-c.mp3", dur: 448 }, // 16.44s → 493f - 45
  d: { file: "music/track-act3-d.mp3", dur: 448 }, // 16.44s → 493f - 45
  e: { file: "music/track-act3-e.mp3", dur: 448 }, // 16.44s → 493f - 45
  f: { file: "music/track-act3-f.mp3", dur: 241 }, //  9.50s → 286f - 45
};

// ── Billboard Captions duration ─────────────────────────────────────────────
import type { BillboardCaption, TerminalFlowBlock, SlideshowConfig } from "../types";

const CAPTION_DEFAULT_HOLD = 25;
const CAPTION_FLASH_OUT = 6;

export function computeBillboardCaptionDuration(captions: BillboardCaption[]): number {
  const captionFrames = captions.reduce((sum, c) => sum + (c.hold ?? CAPTION_DEFAULT_HOLD), 0);
  return captionFrames + CAPTION_FLASH_OUT;
}

// ── Terminal Flow: realistic typing schedule ────────────────────────────────
export const TERMINAL_FLOW_PROMPT_PHASE = 50;
export const TERMINAL_FLOW_END_BUFFER = 90;

// Deterministic hash for per-character jitter
function thash(i: number, seed: number): number {
  return Math.abs(Math.floor(Math.sin(i * 127.1 + seed * 311.7) * 43758.5453));
}

// Adjacent keyboard keys for realistic typos
const ADJ: Record<string, string> = {
  a:"s",b:"v",c:"x",d:"f",e:"r",f:"g",g:"h",h:"j",i:"o",j:"k",k:"l",l:"k",
  m:"n",n:"m",o:"p",p:"o",q:"w",r:"t",s:"d",t:"r",u:"i",v:"c",w:"e",x:"c",y:"t",z:"u",
  ä:"ö",ö:"ä",ü:"u",
};

function typoChar(ch: string, h: number): string {
  const lo = ch.toLowerCase();
  const adj = ADJ[lo];
  if (adj) return ch === ch.toUpperCase() ? adj.toUpperCase() : adj;
  return String.fromCharCode(ch.charCodeAt(0) + (h % 2 === 0 ? 1 : -1));
}

// A typing action in the schedule
export type TypingAction =
  | { t: "c"; ch: string; dur: number }   // type correct char
  | { t: "w"; ch: string; dur: number }   // type wrong char (typo, shown briefly)
  | { t: "b"; dur: number }               // backspace (delete last)
  | { t: "p"; dur: number };              // pause (cursor blinks)

// Build a deterministic typing schedule for a text string.
// Includes irregular timing, micro-pauses, and occasional typos.
export function buildTypingSchedule(text: string, seed = 42): TypingAction[] {
  const actions: TypingAction[] = [];
  let charIdx = 0; // non-newline char counter

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === "\n") {
      actions.push({ t: "c", ch, dur: 0 });
      actions.push({ t: "p", dur: 4 + thash(i, seed + 99) % 5 });
      continue;
    }

    // Irregular base speed: 2-4 frames per char
    const baseDelay = 2 + thash(charIdx, seed) % 3;

    // Typo: ~1 in 30 chars, not at start/end, not on spaces
    if (ch !== " " && charIdx > 4 && i < text.length - 3 && thash(charIdx, seed + 1000) % 30 === 0) {
      actions.push({ t: "w", ch: typoChar(ch, thash(charIdx, seed + 2000)), dur: 4 });
      actions.push({ t: "p", dur: 3 }); // realize mistake
      actions.push({ t: "b", dur: 2 }); // backspace
    }

    actions.push({ t: "c", ch, dur: baseDelay });

    // Micro-pause after punctuation
    if (".!?:".includes(ch)) {
      actions.push({ t: "p", dur: 4 + thash(charIdx, seed + 3000) % 5 });
    } else if (ch === ",") {
      actions.push({ t: "p", dur: 2 + thash(charIdx, seed + 3500) % 3 });
    } else if (ch === " " && thash(charIdx, seed + 4000) % 5 === 0) {
      // occasional brief pause after space (~20%)
      actions.push({ t: "p", dur: 2 + thash(charIdx, seed + 5000) % 3 });
    }

    charIdx++;
  }

  return actions;
}

// Total frames consumed by a typing schedule
export function scheduleFrames(actions: TypingAction[]): number {
  return actions.reduce((sum, a) => sum + a.dur, 0);
}

export function computeTerminalFlowDuration(blocks: TerminalFlowBlock[]): number {
  let frames = TERMINAL_FLOW_PROMPT_PHASE;
  for (const block of blocks) {
    if (block.pause != null) {
      frames += block.pause;
    } else {
      frames += scheduleFrames(buildTypingSchedule(block.text));
    }
  }
  return frames + TERMINAL_FLOW_END_BUFFER;
}

// ── Slideshow duration ──────────────────────────────────────────────────────
const SLIDESHOW_DEFAULT_IMAGE_DURATION = 35;

export function computeSlideshowDuration(config: SlideshowConfig): number {
  const imageDur = config.images.reduce(
    (sum, img) => sum + (img.duration ?? SLIDESHOW_DEFAULT_IMAGE_DURATION),
    0
  );
  const endCardDur = config.endCard?.duration ?? 60;
  return imageDur + endCardDur;
}

export const STILL_FRAMES = {
  slide1: 60,
  slide2: 200,
  slide3: 390,
} as const;

// ── Billboard duration ──────────────────────────────────────────────────────
export const BILLBOARD_ACT1_DURATION = 120;
export const BILLBOARD_ACT3_DURATION = 160;

export function computeBillboardDuration(post: {
  slide2: { text: string };
}): number {
  return (
    BILLBOARD_ACT1_DURATION +
    computeAct2Duration(post.slide2.text) +
    BILLBOARD_ACT3_DURATION
  );
}

// ── Terminal duration ───────────────────────────────────────────────────────
// Char-by-character at 0.5 chars/frame = 2f per char.
// Accounts for startFrame delay and per-char extra frames (every 8th char).
export function computeTerminalAct2Duration(
  text: string,
  charsPerFrame = 0.5,
  startFrame = 6,
  readingBuffer = 60
): number {
  const chars = text.replace(/\n/g, "").length;
  const extraFrames = Math.floor(chars / 8); // matches TerminalText i%8===5 slowdown
  return Math.max(90, startFrame + Math.ceil(chars / charsPerFrame) + extraFrames + readingBuffer);
}

export const TERMINAL_ACT1_DURATION = 75;
export const TERMINAL_ACT3_DURATION = 150;

export function computeTerminalDuration(post: {
  slide2: { text: string };
}): number {
  return (
    TERMINAL_ACT1_DURATION +
    computeTerminalAct2Duration(post.slide2.text) +
    TERMINAL_ACT3_DURATION
  );
}
