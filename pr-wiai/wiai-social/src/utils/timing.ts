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
  readingBuffer = 80
): number {
  const lines = parseTypewriterLines(text);
  const typewriterFrames = lines.reduce(
    (sum, line) => sum + (line.isBlank ? framesPerLine * 2 : framesPerLine),
    0
  );
  return Math.max(90, startFrame + typewriterFrames + readingBuffer);
}

export const STILL_FRAMES = {
  slide1: 60,
  slide2: 200,
  slide3: 390,
} as const;
