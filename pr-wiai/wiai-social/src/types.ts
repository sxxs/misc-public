export type PostType =
  | "newsjacking"
  | "nachtgedanke"
  | "wusstest-du"
  | "led-wall"
  | "selbstironie"
  | "witz"
  | "terminal"
  | "billboard"
  | "slideshow";

// ── Semantic content model — design-independent ─────────────────────────────
// All compositions map these fields into their visual presentation.
// Mapping per design:
//
//  pixel-wall / led-wall:
//    act1Setup   → setup quote (shown first, framed boxes)
//    act1Reveal  → reaction word (GlitchText, appears ~frame 75)
//    act2        → typewriter text
//    act3        → punchline
//    aside       → button/übrigens after punchline
//    textAlign   → vertical alignment of Act1 text block
//
//  billboard:
//    act1Setup   → first hook line (smaller, shown first)
//    act1Reveal  → second hook line (larger, shown below) — optional
//    act2        → argument
//    act3        → punchline
//    aside       → button/note after punchline
//
//  terminal:
//    act1Setup   → prompt string (shown in Act1 with blinking cursor)
//    act1Reveal  → unused
//    act2        → typing text (char-by-char)
//    act3        → punchline (instant reveal)
//    aside       → note/button after punchline (was missing from export before)
//
//  nachtgedanke:
//    act1Setup   → timestamp displayed in Act1 (e.g. "23:47")
//    act2        → typewriter text
//    act3        → punchline
//    aside       → button after punchline
//
//  selbstironie:
//    act1Setup   → label displayed in Act1 (e.g. "Selbstironie")
//    act2        → typewriter text
//    act3        → punchline
//    aside       → button after punchline
//
//  wusstest-du:
//    act1Setup   → subtitle/caption
//    act1Reveal  → big keyword/number (GlitchText)
//    image       → optional background image (15% opacity)
//    act2        → explanation
//    act3        → punchline
//    aside       → button after punchline
//
//  witz:
//    act1Reveal  → question (big yellow text)
//    act2        → punchline (instant reveal)
//    act3        → mic-drop
//    aside       → optional button
//
//  newsjacking:
//    act1Setup   → quote / news context
//    act1Reveal  → reaction word
//    image       → screenshot / background image
//    act2        → commentary
//    act3        → punchline
//    aside       → button
export interface PostContent {
  act1Setup?: string;   // First element in Act1 (setup/quote/prompt/time/label)
  act1Reveal?: string;  // Second element in Act1 (reaction/reveal/bigtext) — optional
  act2: string;         // Act2 body
  act3: string;         // Act3 punchline
  aside?: string;       // Optional note/button/aside after Act3
  asideStyle?: "button" | "uebrigens"; // Display variant for aside (default: "button")
  url?: string;         // Optional CTA URL below aside
  textAlign?: "top" | "center" | "bottom"; // LedWall Act1 vertical alignment
  image?: string;       // Background image for WusstestDu / Newsjacking
}

// ── Contrarian timing config ────────────────────────────────────────────────
export interface ContrarianTiming {
  variant?: "scratch" | "through" | "through-scratch"; // scratch: fade+vinyl+beat-sync (default); through: straight; through-scratch: full volume then vinyl+beat-sync
  act1Duration?: number;           // frames for Act1 slide (default: 150)
  act3Track?: string;              // through-scratch only: key into ACT3_ALT_TRACKS, omit for default track.mp3
  scratchOffset?: number;          // frames before act3Start where scratch starts (default: 15; 0 = at act3Start)
  act3MusicDelay?: number;         // delay Act3 music start by N frames after act3Start (default: 0)
  subtextStartFrame?: number;      // Act3 button/übrigens appear frame (default: 80)
  absenderStartFrame?: number;     // Act3 absender appear frame (default: 155)
}

export interface TerminalConfig {
  color?: "green" | "amber" | "white"; // default: "green"
  mode?: "classic" | "flow";           // classic: 3-act (default); flow: continuous with pauses
  blocks?: TerminalFlowBlock[];        // flow mode only
}

export type TerminalFlowBlock =
  | { text: string; color?: "green" | "amber" | "white"; pause?: never }
  | { pause: number; text?: never; color?: never };

// Billboard config — captions mode for rapid-cut lyric-video style
export interface BillboardConfig {
  mode?: "classic" | "captions"; // classic: 3-act (default); captions: rapid cuts
  captions?: BillboardCaption[];
}

export interface BillboardCaption {
  text: string;
  style?: "white" | "cutout"; // white: white-on-black (default); cutout: black-on-white box
  hold?: number;              // frames to hold (default: 25)
}

// Slideshow config — photo/image-based posts
export interface SlideshowConfig {
  images: SlideshowImage[];
  endCard?: SlideshowEndCard;
}

export interface SlideshowImage {
  src: string;                          // relative to public/, e.g. "media/campus.jpg"
  duration?: number;                    // total visible frames (default: 35)
  effect?: SlideshowEffect | SlideshowEffect[];
  text?: string;                        // optional text overlay
  direction?: "h" | "v";               // for pixel-strips
  hold?: number;                        // frames to hold at effect START state before animating
  effectDuration?: number;              // frames for effect animation (rest = hold at END state)
}

export type SlideshowEffect =
  | "depixelate" | "pixelate" | "depixelate-blur" | "pixelate-blur"
  | "pixel-strips" | "block-reveal"
  | "desaturate" | "saturate" | "tint" | "drift" | "autofocus"
  | "beat";

export interface SlideshowEndCard {
  text?: string;     // default: "@herdom.bamberg"
  duration?: number; // frames (default: 60)
  effect?: SlideshowEffect;
}

export interface Post {
  id: string;
  type: PostType;
  design?: "pixel-wall" | "terminal" | "billboard"; // visual-layer override (future use)
  category?: string;
  accentColor?: string;
  isAd?: boolean;        // opt-in: shows absender/footer on S3 (default: hidden)
  music?: false;         // opt-out of BackgroundMusic (undefined = music on)
  timing?: ContrarianTiming; // led-wall only
  terminal?: TerminalConfig; // terminal-only (color, mode, blocks — NOT prompt)
  billboard?: BillboardConfig; // billboard captions mode
  slideshow?: SlideshowConfig; // slideshow-only
  ledPattern?: string;   // pattern name for LedWall sprite overlay (e.g. "maze")
  content: PostContent;
}
