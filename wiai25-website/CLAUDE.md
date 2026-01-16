# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Website for **WIAI25** – 25 years of the Faculty of Business Information Systems and Applied Informatics (Wirtschaftsinformatik und Angewandte Informatik) at the University of Bamberg. The event is on **June 26, 2026** at the ERBA-Campus.

**Live URL:** https://wiai25.de/

## Project Structure

```
wiai25-website/
├── CLAUDE.md                           # This file
├── wip/                                # Production website
│   ├── index.html                      # Main page
│   ├── style.css                       # Compiled Tailwind CSS
│   ├── event.ics                       # Calendar download
│   ├── deploy.sh                       # Deployment script (USE THIS!)
│   ├── fonts/                          # Self-hosted fonts
│   └── ...
├── archive/                            # Old mockups (historical)
│   ├── wiai25-final.html
│   ├── wiai25-retro.html
│   ├── other/
│   └── ...
└── uba-logo-social-weiss-transparent.svg
```

## Deployment

**IMPORTANT: Use the deploy script!**

```bash
cd wip
./deploy.sh        # Full deploy
./deploy.sh -n     # Dry-run (preview only)
```

The script:
1. Fetches current pixel frame counter from server
2. Updates `defaultFrame` in index.html
3. Builds Tailwind CSS (`npm run build:css`)
4. Syncs to server via rsync
5. Fixes file ownership for Caddy

**Server details:**
- Host: `root@bew`
- Document root: `/var/www/wiai25.de`
- Web server: Caddy

**IMPORTANT:** Don't use manual rsync – the deploy script handles excludes and ownership correctly.

**Caddy routing note:** URLs starting with `/wiai*` are proxied to the pixel backend. Don't name static files with `wiai` prefix (e.g., use `event.ics` not `wiai25-event.ics`).

## Design System

- Colors: Black / White / Yellow (#FACC15) / Gray
- Typography: Outfit (headings), Rubik (body), IBM Plex Mono (monospace)
- Self-hosted fonts in `wip/fonts/`

**Key Constraints:**
- No emojis
- No stock photos or generic tech imagery
- Formal "Sie" address (not "Du")
- No "Tech-Startup-Slop" language

## Technical Stack

- Tailwind CSS (built via npm)
- Self-hosted fonts (WOFF2)
- Canvas-based pixel animation (WIAI25 logo reveal)
- No build step for HTML – single file

## Content Language

All user-facing text is in German. Code comments can be in English.
