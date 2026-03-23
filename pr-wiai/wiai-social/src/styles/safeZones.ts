// Smallest common denominator for TikTok / Reels / Shorts
// Apply once, skip per-platform render variants
export const SAFE = {
  top: 100,       // YouTube title overlay
  bottom: 150,    // TikTok UI bar
  left: 108,      // 80% width → (1080 - 864) / 2
  right: 108,
} as const;
