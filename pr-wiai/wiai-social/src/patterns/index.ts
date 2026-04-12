import { LedPattern } from "../components/LedWall";
import { mazePattern } from "./maze";
import { spaceInvaderPattern } from "./space-invader";
import { pacmanPattern } from "./pacman";
import { lockPattern } from "./lock";
import { eyePattern } from "./eye";
import { binaryRainPattern } from "./binary-rain";
import { heartbeatPattern } from "./heartbeat";
import { exclamationPattern } from "./exclamation";
import { questionPattern } from "./question";

// Pattern registry — post JSON references patterns by name string
export const PATTERNS: Record<string, LedPattern> = {
  maze: mazePattern,
  "space-invader": spaceInvaderPattern,
  pacman: pacmanPattern,
  lock: lockPattern,
  eye: eyePattern,
  "binary-rain": binaryRainPattern,
  heartbeat: heartbeatPattern,
  exclamation: exclamationPattern,
  question: questionPattern,
};

export function resolvePattern(name?: string): LedPattern | undefined {
  return name ? PATTERNS[name] : undefined;
}
