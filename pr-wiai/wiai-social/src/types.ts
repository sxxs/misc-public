export type PostType =
  | "newsjacking"
  | "nachtgedanke"
  | "wusstest-du"
  | "led-wall"
  | "selbstironie"
  | "witz"
  | "terminal"
  | "terminal-doku"
  | "billboard"
  | "slideshow"
  | "apocalypse-billboard";

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
//  nachtgedanke (phone format):
//    act3        → punchline (below phone, Space Grotesk)
//    aside       → dimmed aside below punchline
//    act1Setup, act1Reveal, act2 → unused (searches come from nachtgedanke.searches)
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
  act1SetupReveal?: string; // Optional second setup-line (same 72px box style, delayed fade-in)
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
  totalDuration?: number;            // override total frames (e.g. 360 = 12s); useful for muted renders
  act1Duration?: number;           // frames for Act1 slide (default: 150 with reveal, 100 without)
  act2Duration?: number;           // override computed act2 duration (short texts get over-buffered)
  framesPerLine?: number;          // typewriter speed in Act2 (default: 26; lower = faster reveals)
  act1RevealFrame?: number;        // frame when act1Reveal appears (default: 75)
  act1SetupFrame?: number;         // frame when act1Setup text appears (default: 0 = immediate)
  act1SetupRevealFrame?: number;   // frame when act1SetupReveal appears (default: 45)
  act2TypewriterStart?: number;    // local frame offset before first Act2 line appears (default: 0)
  ledFadeFromBright?: number;      // Act1: LED wall starts fully bright, fades to normal over N frames
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
  act1Duration?: number;               // override default 75
  act2Duration?: number;               // override computed act2 duration
  act3Duration?: number;               // override default 150
  charsPerFrame?: number;              // typing speed override (default: 0.5 = 2 frames/char)
  hookFlash?: "pdf-form";             // brief visual flash in Act1 before prompt text
  act1Style?: "lineByLine";          // lines pop in sequentially, left-aligned (default: static centered)
  lineByLineDelay?: number;          // frames between lines in lineByLine mode (default: 16)
  act2Style?: "escalate";            // split act2 by \n\n, each paragraph bigger + brighter
  act3Top?: number;                  // punchline top position in Act3 (default: 280)
  absenderBottom?: number;           // absender bottom position in Act3 (default: 520)
}

export type TerminalFlowBlock =
  | { text: string; color?: "green" | "amber" | "white"; pause?: never }
  | { pause: number; text?: never; color?: never };

// ── Terminal-Doku (narrative, multi-scene format) ───────────────────────────
export type DokuColor = "green" | "amber" | "white" | "red";

interface DokuSceneBase {
  durationFrames: number;
  color?: DokuColor;
  caption?: string;       // burn-in narration caption (bottom of screen)
}

export type DokuTextEnter = "instant" | "slide-left" | "typed";

export interface DokuTextScreen extends DokuSceneBase {
  kind: "text-screen";
  lines: string[];                // each entry = one rendered line
  enter?: DokuTextEnter;          // default: "instant"
  emphasisLines?: number[];       // line indices to render larger + brighter
  subtitleLines?: number[];       // line indices rendered smaller + dimmed (e.g. "TRUE STORY")
  appearDelay?: number;           // delay between lines in typed/slide mode (default: 8f)
  perLineReveal?: number[];       // explicit appear frame per line index (overrides appearDelay)
  glitchBeforeEnd?: number;       // frames before scene end: brief CRT flicker on emphasisLines
  align?: "center" | "left";      // default: "center"
}

export interface DokuStatusLogEntry {
  label: string;
  value: string;
  glow?: boolean;                 // pulse the value in green
}

export interface DokuStatusLog extends DokuSceneBase {
  kind: "status-log";
  entries: DokuStatusLogEntry[];
}

export interface DokuLogCrawlLine {
  text: string;
  glitchAt?: number;              // local frame where the glitch hits this line
  replaceWith?: string;           // text after glitch (alert state)
  alert?: boolean;                // if true, post-glitch line is rendered red
}

export interface DokuLogCrawl extends DokuSceneBase {
  kind: "log-crawl";
  lines: DokuLogCrawlLine[];
  lineDelay?: number;             // frames between line reveals (default: 18)
}

export interface DokuTimelineEntry {
  time: string;                   // e.g. "T+00"
  label: string;                  // e.g. "TRIEBWERKSZUENDUNG"
  glitchTo?: string;              // text to flip to after glitch
  glitchAt?: number;              // local frame to trigger the glitch
  alert?: boolean;                // post-glitch rendered in red
}

export interface DokuTimeline extends DokuSceneBase {
  kind: "timeline";
  header?: string[];              // lines shown in a box above the timeline
  connectorLabel?: string;        // label on the vertical connector line
  entries: DokuTimelineEntry[];
}

export interface DokuDualBoxSide {
  title: string;
  lines: string[];
}

export interface DokuDualBox extends DokuSceneBase {
  kind: "dual-box";
  left: DokuDualBoxSide;
  right: DokuDualBoxSide;
  glowWords?: string[];           // words inside boxes that pulse (e.g. "NEIN")
  subline?: string;               // small line under the boxes
  matchLines?: number[];          // line indices (0-based) that are identical in both boxes → blink red, others dimmed
  matchLabel?: string;            // label shown between boxes pointing at the match region
}

export interface DokuIntCounter extends DokuSceneBase {
  kind: "int-counter";
  boxTitle: string;
  format: "INT16 (SIGNED)";
  maxValue: number;               // typically 32767
  startValue: number;             // e.g. 28000
  peakValue: number;              // last value before overflow (e.g. 32767)
  overflowValue: number;          // wrap-around target (e.g. -32768)
  countSpeed?: "slow-to-fast" | "linear"; // default: slow-to-fast
  pauseAtPeak?: number;           // frames the counter sits on peak before flipping (default: 8)
  postOverflowExtras?: string[];  // extra status lines below the value, e.g. ["STATUS: EXCEPTION"]
}

export interface DokuAftermath extends DokuSceneBase {
  kind: "aftermath";
  lines: string[];
  silent?: boolean;               // intentional reminder marker (no audio cue)
}

export interface DokuOutroCard extends DokuSceneBase {
  kind: "outro-card";
  title: string;                  // big line, e.g. "@echt.bamberg"
  subtitle?: string;              // smaller line below, e.g. "WIAI · UNI BAMBERG"
}

export type DokuScene =
  | DokuTextScreen
  | DokuStatusLog
  | DokuLogCrawl
  | DokuTimeline
  | DokuDualBox
  | DokuIntCounter
  | DokuAftermath
  | DokuOutroCard;

export interface DokuWordCaption {
  frame: number;    // absolute frame (at 30fps) when this chunk appears
  text: string;     // 2–4 words shown together
}

export interface DokuConfig {
  scenes: DokuScene[];
  narrationFile?: string;         // relative to public/ — narration voice-over
  musicFile?: string;             // relative to public/ — background drone/music (looped, ducked during speech)
  wordCaptions?: DokuWordCaption[]; // word-chunk captions synced to narration frames
  totalDuration?: number;         // override; default = sum of scene durations
  flickerBetweenScenes?: boolean; // default: true — CRT flicker on cuts
  channelTag?: string;            // tiny "@echt.bamberg" tag bottom-right (default: shown on last scene)
}

// Billboard beat: one element in an Act2 beat sequence
export interface BillboardBeat {
  text: string;
  at: number;                    // frame within Act2 when this beat fades in
  style?: "dim" | "heckle";     // default: main text (white, bold); dim: 70% white; heckle: accent + monospace
  size?: number;                 // fontSize override (default: 96, heckle: 54, dim: 72)
}

// Billboard config — captions mode for rapid-cut lyric-video style
export interface BillboardConfig {
  mode?: "classic" | "captions"; // classic: 3-act (default); captions: rapid cuts
  captions?: BillboardCaption[];
  act1Duration?: number;         // override default 120
  act2Duration?: number;         // override computed act2 duration (for beat-sync)
  act3Duration?: number;         // override default 160
  revealAtFrame?: number;        // frame when act1Reveal appears (default: 14)
  beats?: BillboardBeat[];       // Explicit Act2 beat sequence — overrides \n\n splitting
  wiggleFrames?: number[];       // Act3-local frames: punchline text wiggles on each hit
  hookFlash?: "ikea-manual";     // brief visual flash in Act1 before text appears
  act1Flicker?: boolean;         // subtle fluorescent-tube flicker on Act1 text (power fluctuations)
}

export interface BillboardCaption {
  text: string;
  style?: "white" | "cutout"; // white: white-on-black (default); cutout: black-on-white box
  hold?: number;              // frames to hold (default: 25)
}

// Nachtgedanke phone config — phone as atmospheric backdrop, text overlays
export interface NachtgedankeBlock {
  text: string;
  italicText?: string;             // rendered italic below text with gap
  revealText?: string;             // extra line that fades in after revealDelay
  revealDelay?: number;            // frames after block start before reveal (default: 30)
  at: number;                      // frame when block appears
  hold: number;                    // frames visible
}

export interface NachtgedankeConfig {
  time: string;                    // status bar clock ("02:47")
  batteryPercent?: number;         // status bar battery level (default: 15)
  phoneInDuration?: number;        // phone entrance + zoom-to-time (default: 50)
  overthinkingLabel?: string;      // text during zoom phase (default: "#overthinking")
  zoomAt?: number;                 // frame of hard-cut zoom (default: 10)
  zoomOutAt?: number;              // frame when zoom-out begins (default: 55)
  blocks: NachtgedankeBlock[];     // text overlay sequence
  punchlineDuration?: number;      // hold for act3 + aside (default: 95)
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
  textPosition?: "top" | "center" | "bottom"; // vertical placement (default: center)
  textLineFrames?: number[];            // per-line pop-in frame offsets (beat-sync); default: all 0 (fade in together)
  textSizes?: number[];                 // per-line font size override (default: 72)
  flashToWhite?: number;                // last N frames ramp up to white (peak on last frame)
  flashFromWhite?: number;              // first N frames fade from white (peak on frame 0)
  direction?: "h" | "v";               // for pixel-strips
  hold?: number;                        // frames to hold at effect START state before animating
  effectDuration?: number;              // frames for effect animation (rest = hold at END state)
  effectSteps?: number[];               // beat-sync: discrete frame thresholds; progress snaps to N levels (last → fully sharp)
  imageScale?: number;                  // extra zoom on the photo (default 1)
  imageTranslateY?: number;             // vertical crop offset in px; + = crop bottom, - = crop top
  imageScaleEnd?: number;               // animate zoom over duration (default = imageScale)
  imageTranslateYEnd?: number;          // animate translateY over duration (default = imageTranslateY)
  stack?: string[];                     // triptych: 2-3 images stacked vertically (replaces src)
  zoomTo?: number;                      // stack panel index to zoom into during animation (0-based)
  stackRevealOrder?: number[];          // panel indices in appear order (e.g. [1,0,2] = middle, top, bottom)
  stackTints?: string[];                // CSS filter per panel (e.g. ["grayscale(0.6)", "", "sepia(0.3) saturate(1.4)"])
  stackBackdrop?: string;               // backdrop color (e.g. "#FACC15") — rendered as big blurred blob behind panels
  stackPanelGap?: number;               // px gap between panels (default 0)
}

export type SlideshowEffect =
  | "depixelate" | "pixelate" | "depixelate-blur" | "pixelate-blur"
  | "pixel-strips" | "block-reveal"
  | "desaturate" | "saturate" | "tint" | "drift" | "autofocus"
  | "beat";

export interface SlideshowEndCard {
  text?: string;     // main line (default: "@echt.bamberg")
  subtitle?: string; // sub-line (default: "WIAI · Uni Bamberg")
  duration?: number; // frames (default: 60)
  effect?: SlideshowEffect;
}

export interface Post {
  id: string;
  type: PostType;
  design?: "pixel-wall" | "terminal" | "terminal-doku" | "billboard"; // visual-layer override (future use)
  category?: string;
  accentColor?: string;
  isAd?: boolean;        // opt-in: shows absender/footer on S3 (default: hidden)
  music?: false;         // opt-out of BackgroundMusic (undefined = music on)
  musicFile?: string;    // custom track (default: music/track.mp3)
  sfxFile?: string;      // additional SFX audio layer (plays full duration, same fade-out)
  musicFadeOut?: number; // fadeout frames at video end (default: 3)
  timing?: ContrarianTiming; // led-wall only
  terminal?: TerminalConfig; // terminal-only (color, mode, blocks — NOT prompt)
  doku?: DokuConfig;          // terminal-doku narrative format (multi-scene)
  billboard?: BillboardConfig; // billboard captions mode
  slideshow?: SlideshowConfig; // slideshow-only
  nachtgedanke?: NachtgedankeConfig; // phone-format nachtgedanke
  ledPattern?: string;   // pattern name for LedWall sprite overlay (e.g. "maze")
  ledBeatFrames?: number[]; // beat-sync: pattern flashes at these absolute frames (7f on, then off)
  ledScroll?: number;    // rows/sec vertical scroll for LedWall (bright bands sweep upward)
  content: PostContent;
}
