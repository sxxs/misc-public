export interface ProjectData {
  title: string;
  subtitle: string;
  version: string;
  description: string;
  tech: string[];
  color: string;
  accentColor: string;
  emoji: string;
  url: string;
}

export const projects: ProjectData[] = [
  {
    title: "Pocket Heist",
    subtitle: "Asymmetric 2-Player Stealth Strategy",
    version: "v2.4.2",
    description:
      "Build levels with guards & cameras, then challenge friends to infiltrate them. Canvas rendering, A* pathfinding, raycasting vision cones.",
    tech: ["Canvas", "Tone.js", "A* Pathfinding", "LZString", "PWA"],
    color: "#1a1a2e",
    accentColor: "#e94560",
    emoji: "🕵️",
    url: "sxxs.github.io/misc-public/pocket-heist/",
  },
  {
    title: "Multiplication Troll",
    subtitle: "Math Learning Game with a Twist",
    version: "v1.2.0",
    description:
      "Retro math game where tasks change while you type! Falling blocks, on-screen keyboard, and troll mechanics keep you on your toes.",
    tech: ["Canvas", "Web Audio", "PWA", "Mobile-First"],
    color: "#0d1117",
    accentColor: "#58a6ff",
    emoji: "🧌",
    url: "sxxs.github.io/misc-public/multiplication-troll-game/",
  },
  {
    title: "Weihnachts-Katzen Jump",
    subtitle: "Christmas Cat Jump & Run",
    version: "v6.2",
    description:
      "Endless jumper with combo system, 7 power-ups, 6 platform types, boss fight, and generative Christmas music. All in a single HTML file.",
    tech: ["Web Audio API", "Canvas", "PWA", "Generative Music"],
    color: "#1b2838",
    accentColor: "#66c0f4",
    emoji: "🐱",
    url: "sxxs.github.io/misc-public/jumpcat/",
  },
  {
    title: "Neon Mind",
    subtitle: "2-Player Reaction Game",
    version: "v1.0.0",
    description:
      "Split-screen reaction duel. A shape flashes, both players race to match it. Dynamic handicap system keeps it competitive.",
    tech: ["React", "Tailwind CSS", "Web Audio", "Synthwave"],
    color: "#0f0a1a",
    accentColor: "#a855f7",
    emoji: "🧠",
    url: "sxxs.github.io/misc-public/neon-mind/",
  },
  {
    title: "Neon Link",
    subtitle: "Highscore Puzzle Game",
    version: "v1.0",
    description:
      "Connect matching neon tiles in this fast-paced puzzle game. Chain combos for massive scores.",
    tech: ["Canvas", "CSS Animations", "Touch Events"],
    color: "#0a0a1a",
    accentColor: "#06ffa5",
    emoji: "🔗",
    url: "sxxs.github.io/misc-public/neon-link/",
  },
  {
    title: "Hashcards",
    subtitle: "Spaced Repetition Flashcards",
    version: "v1.4.4",
    description:
      "FSRS-powered flashcard app with Markdown import, multiple decks, and offline support. All in 195KB.",
    tech: ["IndexedDB", "FSRS", "PWA", "Markdown"],
    color: "#1a1625",
    accentColor: "#f59e0b",
    emoji: "🃏",
    url: "sxxs.github.io/misc-public/hashcards-pwa/",
  },
];
