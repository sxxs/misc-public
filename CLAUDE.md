# Claude Code Instructions

## Repository Structure

This is a mono-repo with multiple independent web projects:

```
misc-public/
├── index.html                 # Landing page with project links
├── .nojekyll                  # Disables Jekyll (see Deployment section)
├── pocket-heist/              # Stealth strategy game (v2.4.x)
├── multiplication-troll-game/ # Math learning game (v1.2.x)
├── jumpcat/                   # Christmas cat jump & run (v5.0)
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

Christmas-themed jump & run game with a cat.

**Key Features:**
- Double-jump mechanic
- Dynamic world themes (change at 10/20/30/40 points)
- Power-ups: Slow-Mo, Speed, Extra Life, Gift
- Generative Christmas music (Web Audio API)
- Single-file architecture (all in index.html)

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
