# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of public projects and demos. Currently contains:
- **Multiplication Troll Game**: A retro-style educational game for practicing multiplication tables with "troll mechanics" (spontaneous task changes while typing)

## Multiplication Troll Game Architecture

### Technology Stack
- Pure Vanilla JavaScript (no build system, no dependencies)
- HTML5 Canvas for game rendering
- CSS3 with modern features (Flexbox, Grid, Gradients)
- Fully client-side, deployed to GitHub Pages

### Core Game Mechanics
Located in `multiplication-troll-game/game.js`:

1. **Task System**: Falling multiplication tasks (1×1 to 10×10) that the player must solve before they reach the bottom
2. **Troll Mechanics**: 30% chance tasks will spontaneously change their numbers while the player is typing
3. **Progressive Difficulty**: Speed increases 5% per level, levels advance every 5 correct answers
4. **Mobile Support**: Touch-friendly on-screen keyboard with optimized layout

### Key Configuration (game.js:27-38)
- `FALL_TIME_SECONDS`: Base time for tasks to fall (20 seconds)
- `SPEED_INCREASE_PER_LEVEL`: Multiplier for speed increase (1.05 = 5%)
- `TROLL_CHANCE`: Probability of troll mechanics triggering (0.3 = 30%)
- `MAX_TASKS_ON_SCREEN`: Maximum concurrent falling tasks (5)

### Audio System
- **Music Manager**: Alternates between two background loops, playing each 3 times
- **SFX Manager**: Handles correct/wrong answer sounds and game over
- Music volume set to 0.3, SFX volume 0.8-0.9 for proper balance

### Cache-Busting Strategy
The game implements a session-based cache-busting mechanism (game.js:5-24) that:
- Generates random version parameter on fresh page loads
- Uses `sessionStorage` to prevent infinite redirect loops
- Ensures updates are immediately visible to players

### Mobile Optimizations
- Custom on-screen numeric keyboard (index.html:44-57)
- Touch-action optimizations to prevent unwanted scrolling
- Responsive font sizes using CSS `clamp()`
- `inputmode="numeric"` for native keyboard on mobile devices
- 44x44px minimum touch target sizes

### Color Palette
Defined in style.css, uses consistent orange/teal retro theme:
- Primary: `#00D9FF` (Teal/Cyan) - UI elements
- Accent: `#FF6B35`, `#FF8800` (Orange) - Highlights
- Player/Gold: `#FFD700` - Player character
- Troll indicator: `#FF1493` (Pink)
- Background: `#0F1419`, `#1A1F2E` (Dark)

## Development Workflow

### Testing the Game
Simply open `multiplication-troll-game/index.html` in a browser. No build step required.

For mobile testing, use browser dev tools device emulation or deploy to a local server:
```bash
cd multiplication-troll-game
python3 -m http.server 8000
# Then open http://localhost:8000 on your mobile device
```

### Deployment
The game is deployed to GitHub Pages at: https://sxxs.github.io/misc-public/multiplication-troll-game/

To deploy updates:
1. Make changes to files in `multiplication-troll-game/`
2. Commit and push to the `main` branch
3. Changes will be live automatically via GitHub Pages

### Version Management
Update the version number in three locations when making releases:
- `game.js:2` - `const VERSION`
- `index.html:7` - stylesheet link query parameter
- `index.html:76` - script link query parameter

## Code Style Conventions

### JavaScript
- ES6+ features throughout (classes, const/let, arrow functions)
- Configuration constants at top of file in `CONFIG` object
- Canvas rendering uses requestAnimationFrame for smooth 60fps
- Event listeners use arrow functions to preserve `this` context

### CSS
- Mobile-first responsive design
- Uses CSS custom properties could be added for theme colors (currently hardcoded)
- Text uses monospace fonts (`Courier New`) for retro aesthetic
- Neon glow effects via `text-shadow` and `box-shadow`

### HTML
- Semantic structure with clear ID naming
- Audio elements preloaded for instant playback
- Input attributes optimized for mobile (inputmode, pattern, autocomplete)

## Important Implementation Details

### Canvas Rendering
The canvas uses a dynamic sizing approach (style.css:75-88) where:
- Canvas element has fixed width/height attributes (800×600)
- CSS makes it fill available space with `width: 100%; height: 100%`
- Game coordinates use the logical 800×600 space
- Browser handles scaling to actual display size

### Game State Management
Game uses a simple state machine with phases:
- Start screen
- Playing (with pause capability)
- Game over screen

State is managed through DOM visibility (adding/removing `hidden` class) and button enable/disable states.

### Sound Playback Strategy
Audio elements are reset to `currentTime = 0` before each play to allow rapid repeated sounds. Errors are caught and logged but don't break gameplay.
