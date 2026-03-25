import { LedPattern } from "../components/LedWall";
import { mazePattern } from "./maze";

// Pattern registry — post JSON references patterns by name string
export const PATTERNS: Record<string, LedPattern> = {
  maze: mazePattern,
};

export function resolvePattern(name?: string): LedPattern | undefined {
  return name ? PATTERNS[name] : undefined;
}
