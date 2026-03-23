export type PostType =
  | "newsjacking"
  | "nachtgedanke"
  | "wusstest-du"
  | "contrarian"
  | "selbstironie"
  | "witz";

// Contrarian timing config — all fields optional, sensible defaults apply
export interface ContrarianTiming {
  variant?: "scratch" | "through" | "through-scratch"; // scratch: fade+vinyl+beat-sync (default); through: straight; through-scratch: full volume then vinyl+beat-sync
  act1Duration?: number;           // frames for Act1 slide (default: 150)
  act3Track?: string;              // through-scratch only: key into ACT3_ALT_TRACKS, omit for default track.mp3
  scratchOffset?: number;          // frames before act3Start where scratch starts (default: 15; 0 = at act3Start)
  act3MusicDelay?: number;         // delay Act3 music start by N frames after act3Start (default: 0)
  subtextStartFrame?: number;      // Act3 button/übrigens appear frame (default: 80)
  absenderStartFrame?: number;     // Act3 absender appear frame (default: 155)
}

export interface Post {
  id: string;
  type: PostType;
  category?: string;
  accentColor?: string;
  isAd?: boolean;        // opt-in: shows absender/footer on S3 (default: hidden)
  timing?: ContrarianTiming; // contrarian-only
  slide1: {
    image?: string;
    time?: string;
    label?: string;
    bigText?: string;
    smallText?: string;
  };
  slide2: {
    text: string;
  };
  slide3: {
    text: string;          // S3 punchline/closing beat
    button?: string;       // optional: comedian's follow-up tag (no label, inline)
    übrigensText?: string; // optional: aside with "ÜBRIGENS…" label — alternative to button
    url?: string;          // optional: small CTA URL below button/übrigensText
  };
}
