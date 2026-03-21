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

// Returns how many lines are visible at localFrame.
// Normal line: 6 frames each. Blank line (paragraph break): 12 frames.
export function getVisibleLineCount(
  lines: TypewriterLine[],
  localFrame: number,
  startFrame = 10
): number {
  let cursor = startFrame;
  for (let i = 0; i < lines.length; i++) {
    const delay = lines[i].isBlank ? 12 : 6;
    if (localFrame < cursor) return i;
    cursor += delay;
  }
  return lines.length;
}

// Still frames for render.sh — middle of each act where content is fully visible
export const STILL_FRAMES = {
  slide1: 60,
  slide2: 200,
  slide3: 390,
} as const;
