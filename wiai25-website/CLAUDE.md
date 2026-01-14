# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML mockups for the **WIAI25** anniversary website celebrating 25 years of the Faculty of Business Information Systems and Applied Informatics (Wirtschaftsinformatik und Angewandte Informatik) at the University of Bamberg. The event is on **June 26, 2026** at the ERBA-Campus.

This is a design prototype phase - final implementation will use Hugo and Tailwind CSS.

## Project Structure

```
wiai25-website/
├── wiai25-final.html       # RECOMMENDED: Bold black/yellow design
├── wiai25-uni-style.html   # Alternative: Petrol/beige elegant design
├── wiai25-retro.html       # Satire: Classic Uni-Bamberg style (warning example)
├── other/                  # Earlier iterations (v2, v3, v4, balanced, clean, mockup, variants)
├── wiai-2021.png           # Reference screenshot of 2021 website
└── PLAN.md                 # Complete project documentation and design decisions
```

## Design System

**Primary Design (wiai25-final.html):**
- Colors: Black / White / Yellow (#FACC15) / Gray
- Typography: Inter (sans), JetBrains Mono (monospace)
- Section headings use skewed black boxes with yellow text
- Visual rhythm: Black (Hero) → Yellow (Stats) → Light (Content) → Yellow (CTA) → Black (Footer)

**Key Design Constraints:**
- No emojis
- No stock photos or generic tech imagery
- Formal "Sie" address (not "Du") for broad audience appeal
- No "Tech-Startup-Slop" language ("SHAPE THE FUTURE", etc.)

## Technical Stack

All mockups use:
- Tailwind CSS via CDN (`https://cdn.tailwindcss.com`)
- Google Fonts (Inter, JetBrains Mono)
- Self-contained single HTML files

Future implementation: Hugo static site generator with Tailwind CSS build.

## Content Language

All user-facing text is in German. Code comments can be in English.

## Deployment Note

This project is NOT linked from the main repo index.html (misc-public/index.html). The mockups are internal drafts and not part of the public project listing.
