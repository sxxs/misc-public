# Claude Code Instructions

## Repository Structure

This is a mono-repo with multiple independent web projects:

```
misc-public/
├── index.html                 # Landing page with project links
├── .nojekyll                  # Disables Jekyll (see Deployment section)
├── pocket-heist/              # Stealth strategy game (v2.4.x)
├── multiplication-troll-game/ # Math learning game (v1.2.x)
├── jumpcat/                   # Christmas cat jump & run (v6.2)
├── neon-mind/                 # 2-player reaction game (v1.0.0)
├── hashcards-pwa/             # Spaced repetition flashcards (v1.0.0)
├── was-gibts/                 # Family meal decider PWA (v1.3)
├── wiai25-enhance/            # Static demo
├── uni-bamberg-wrapper/       # University website wrapper with CORS proxy
├── uni-bamberg-mockup/        # Mockup and crawler for uni-bamberg
└── README.md
```

## Deployment

All projects are deployed via GitHub Pages from the `main` branch:
- https://sxxs.github.io/misc-public/ (landing page)
- https://sxxs.github.io/misc-public/pocket-heist/
- https://sxxs.github.io/misc-public/multiplication-troll-game/
- https://sxxs.github.io/misc-public/jumpcat/
- https://sxxs.github.io/misc-public/neon-mind/
- https://sxxs.github.io/misc-public/hashcards-pwa/
- https://sxxs.github.io/misc-public/was-gibts/
- https://sxxs.github.io/misc-public/wiai25-enhance/

### GitHub Pages Configuration

**`.nojekyll`** - Disables Jekyll processing. Required because:
- `uni-bamberg-mockup/mockup/crawler` is a symlink to `../crawler`
- Jekyll fails on symlinks during build
- Without Jekyll, GitHub Pages serves static files directly

**`index.html`** - Root landing page. Required because:
- With `.nojekyll`, README.md is not auto-converted to index.html
- Provides clickable links to all projects

## Project Details

### Pocket Heist

Asymmetric 2-player stealth strategy game.

**Architecture:**
- `game.js` - Main game logic (~2300 lines)
- `style.css` - All styles with mobile-first approach
- `sw.js` - Service Worker for PWA
- `PLAN-*.md` - Implementation plans for features

**Key Systems:**
- **Rendering**: Canvas-based with dynamic `TILE_SIZE` calculation
- **Audio**: Tone.js for generative music (ambient/tense modes) and SFX
- **Pathfinding**: A* algorithm for player and guard movement
- **Vision Cones**: Raycasting with wall clipping (40 rays per cone)
- **Serialization**: LZString compression for level/replay codes

**Game Modes:**
- `architect` - Build levels with guards, cameras, traps
- `infiltrator` - Play through levels, reach the vault
- `replay` - Watch recorded playthroughs

**Touch Handling:**
- Tap to place/move
- Drag to paint walls (architect mode)
- No panning (auto-scale to fit screen)

### Multiplication Troll Game

Retro math learning game with troll mechanics.

**Key Features:**
- Tasks change while typing (troll mechanic)
- On-screen keyboard for mobile
- Falling blocks gameplay
- Audio feedback (correct/wrong/game over)

### JumpCat (Weihnachts-Katzen Jump)

Christmas-themed jump & run game with a cat (v6.2).

**Core Mechanics:**
- Double/Triple-jump mechanic
- Coin collection as primary score system
- Combo system (5x, 10x, 20x) for consecutive coins
- Up to 3 extra lives (hearts)
- Dynamic world themes (change at 10/20/30/40 internal points)

**Power-ups:**
- ❄️ Slow-Mo - Slows game speed
- 🚀 Speed - Increases game speed
- ❤️ Heart - Extra life (max 3)
- 🎁 Gift - Multi-bonus (slow + life + 20 coins)
- ⬆️ Triple Jump - 3 jumps instead of 2
- 🪽 Glide - Reduced gravity when falling
- 😼 Catnip Rage - Grow large, destroy candles

**Platform Types (unlocked progressively):**
- Normal platforms (score 0+)
- Shaking platforms (score 12+)
- Moving platforms (score 15+)
- Crumbling platforms (score 25+) - break when standing too long
- Ice platforms (score 35+) - slippery physics
- Bouncy platforms (score 45+) - catapult jump

**Boss Fight (30 coins):**
- Evil Snowman boss appears at 30 collected coins
- Jump + tap throws snowballs at boss
- Boss shoots snowballs back
- 5 hit points to defeat
- Snowball throwing has 0.3s cooldown

**Technical:**
- Single-file architecture (all in index.html)
- Cache-busting via URL parameter redirect (`?v=6.2`)
- Generative Christmas music (Web Audio API)
- localStorage for highscore (coin-based)
- Combo text animations and visual effects

### Neon Mind (Panic Edition)

Fast-paced 2-player reaction game (v1.0.0).

**Gameplay:**
- Two players face each other on one device (split screen, top rotated 180°)
- A shape flashes briefly in the center
- Players race to tap the matching shape from 4 options
- First to 10 points wins

**Mechanics:**
- Correct answer: +1 point
- Wrong answer: -1 point (can't go below 0)
- Leader handicap: flash duration decreases as point lead grows
- Base flash time: 500ms, minimum: 100ms

**Shapes:**
- Tetris-style pieces: I, O, T, S, Z, J, L, X
- Easter egg shapes (20% chance): Glider, Space Invader, Pac-Man

**Technical:**
- Single-file architecture (React via CDN)
- Tailwind CSS for styling
- Web Audio API for SFX and synthwave music
- No build step required

### Was gibt's?

Family meal decider PWA (v1.3). Static, no server, no accounts.

**Workflow:**
- People: Felix, Jakob, Moritz, Kathrin, Dominik (v1.1 "Eltern" state auto-migrates to both parents)
- Each family member rates the dishes ("Sichtung"), optionally plays ranking duels ("Turnier")
- Any rating can be revised later via the searchable list under "Sichtung"
- State lives in `localStorage`; transfer between devices via QR code or typed code
- Tablet aggregates results ("Ergebnis" incl. Bestenliste per person and overall)
  and builds a weekly plan ("Wochenplan")
- Family code (person index 7) carries all persons at once - for pushing the
  tablet's aggregate state back to every device; also carries the paused-dishes
  list (appended block, backward/forward compatible with v1.2 codes)
- Weekly plan: Mon-Fri one simple meal each (effort <= 2 preferred), Sat/Sun lunch +
  dinner; one weekend slot is pizza/burger/grilling (`grillen` tag or name match),
  one slot is an Entdeckungspool experiment
- Plan controls: per-slot swap button (keeps klassiker/experiment role), Brotzeit-Woche
  toggle (2x `brotzeit`-tagged dishes on Mon/Tue or Tue/Wed), pause list (globally
  disable dishes, e.g. Raclette without the device - excluded from plan only)

**Dish list (`dishes.json`):**
- Position in the file is the dish's stable ID - append-only!
- Never insert, delete, or reorder mid-file; retire dishes with `"aus": true` instead
- Renaming and fixing fields (`b`, `p`, `e`, `t`, `w`) is safe; max 511 entries
- `w` = kid-friendly "Was ist das?" explanation, shown on the Sichtung card
- Kid-friendly dish names; explain foreign dishes via `w`
- New dishes show up in everyone's Sichtung queue automatically
- Transfer codes (format v3) carry the dish count, so codes from older/shorter
  lists stay readable after the list grows

**Technical:**
- App logic in `index.html`, dish list fetched from `dishes.json`
- Network-first service worker: list updates propagate on next online load
  (no cache-name bump needed for content changes)
- Offline-capable PWA (manifest + service worker + icons)

### Uni Bamberg Wrapper

Website wrapper that fetches and displays uni-bamberg.de content.

**Components:**
- `cors-proxy.py` - Python CORS proxy server
- `script.js` - Content fetching and caching
- `start-proxy.sh` - Launch script

## Development Guidelines

### Versioning
- Each project has its own version in the main JS file
- Update version numbers in: JS file, index.html (CSS/JS refs), sw.js
- Use semantic versioning (MAJOR.MINOR.PATCH)

### Cache Busting
All projects use:
1. Meta tags: `Cache-Control`, `Pragma`, `Expires`
2. Version query params: `style.css?v=X.X.X`, `game.js?v=X.X.X`
3. Network-first Service Worker

### PWA Setup
All three games are installable PWAs with:
- `manifest.json`
- `sw.js` (Service Worker)
- Icons (192px, 512px, apple-touch-icon)
- Apple meta tags for iOS

### Mobile First
- Test on iPhone SE (320px) as minimum width
- Use `clamp()` for responsive font sizes
- Touch targets minimum 44px
- Avoid zoom on input focus (iOS)

## Git Workflow

- Work on feature branches, merge to `main`
- `main` branch deploys automatically to GitHub Pages
- Delete merged branches to keep repo clean

## Language

- Code comments: English
- User-facing text: German (for games)
- Commit messages: English
