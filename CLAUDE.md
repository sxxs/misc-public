# Claude Code Instructions

## Repository Structure

This is a mono-repo with multiple independent web projects:

```
misc-public/
├── pocket-heist/          # Stealth strategy game (v2.4.x)
├── multiplication-troll-game/  # Math learning game (v1.2.x)
├── wiai25-enhance/        # Static demo
└── README.md
```

## Deployment

All projects are deployed via GitHub Pages from the `main` branch:
- https://sxxs.github.io/misc-public/pocket-heist/
- https://sxxs.github.io/misc-public/multiplication-troll-game/
- https://sxxs.github.io/misc-public/wiai25-enhance/

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
Both games are installable PWAs with:
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
- User-facing text: German (for these projects)
- Commit messages: English
