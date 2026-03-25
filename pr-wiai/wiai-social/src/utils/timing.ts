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
