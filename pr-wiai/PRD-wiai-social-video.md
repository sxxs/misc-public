# PRD: WIAI Social Video Generator

## Überblick

CLI-basiertes Videogenerations-System mit [Remotion](https://www.remotion.dev/) für die Social-Media-Präsenz der Fakultät WIAI, Universität Bamberg. Erzeugt 9:16-Kurzvideos (TikTok, YouTube Shorts, Instagram Reels) und statische Carousel-Bilder (Instagram) aus einer einzigen JSON-Konfiguration pro Post.

Der visuelle Stil ist **bold, pop-art-artig, schwarz-dominant mit WIAI-Gelb (#FFE500) als Akzentfarbe**, inspiriert von der Jubiläumsseite wiai25.de. Ton: süffisant, lakonisch, trocken-humorvoll. Das System wird vom Dekan persönlich bespielt (@herdom).

---

## Technologie-Stack

- **Remotion 4.x** (React-basierte Videoerstellung)
- **TypeScript**
- **Node.js 20+**
- Fonts: **Space Grotesk** (Headlines), **Space Mono** (Mono/UI-Elemente)
- Output: MP4 (H.264, 1080×1920, 30fps) + PNG-Slides (1080×1350 für Instagram Carousel, 1080×1920 für Stories/Reels)

---

## Post-Typen

Das System unterstützt sechs verschiedene Post-Typen. Jeder hat eine eigene Remotion-Composition, aber alle teilen das gleiche Design-System (Farben, Fonts, Branding-Footer, Halftone-Texturen).

### Typ 1: Newsjacking

Drei Slides / Drei Video-Acts:

**Slide 1 — Hook (0–4s):** Zeigt einen Screenshot einer Nachricht (als Bild übergeben), überlagert mit einem Halftone-Rasterfilter und Scanlines. Darunter eine lakonische 1–3-Wort-Reaktion ("Ach.", "Tja.", "Nein.") in großer Schrift mit Glitch-Effekt (RGB-Offset).

**Slide 2 — Punchline (4–11s):** Schwarzer Hintergrund mit Halftone-Dots. Darauf ein weißer/cremefarbener Textblock (#F0EDE8) mit "dirty edges" (leicht unregelmäßiges Clipping, leicht rotiert) und einem farbigen Offset-Schatten in der Akzentfarbe. Text baut sich Zeile für Zeile auf (Typewriter-Effekt, ca. 200ms pro Zeile Verzögerung).

**Slide 3 — CTA (11–15s):** "LINK IN BIO" in der Akzentfarbe, darunter die URL in einem Box-Element mit Akzentfarben-Border, darunter ein Subtext in gedimmtem Weiß. WIAI-Logo pulsiert einmal kurz.

### Typ 2: 23-Uhr-Gedanke

Visuell maximal reduziert. Kein Halftone, kein Glitch.

**Slide 1 — Uhrzeit (0–2s):** Schwarzer Screen. Oben links erscheint eine Uhrzeit in kleiner, gedimmter Monospace-Schrift (z.B. "23:47"). Kurze Fade-In-Animation.

**Slide 2 — Gedanke (2–12s):** Weißer Text auf schwarzem Grund, zentriert, baut sich Zeile für Zeile auf. Keine Dekoration. Kein Logo. Schriftgröße so gewählt, dass der Text die vertikale Mitte füllt. Zeilenumbrüche werden exakt aus der Konfiguration übernommen.

**Slide 3 — CTA (12–15s):** Minimal. URL in gedimmtem Weiß, WIAI UNI BAMBERG klein unten. Kein "Link in Bio"-Label, nur die URL. Fade-In.

### Typ 3: Wusstest-du-schon

**Slide 1 — Fact-Hook (0–4s):** Ein großes Keyword oder eine Zahl (z.B. "WELTMEISTER.", "380 LAPTOPS.", "BLINKIST") mit Glitch-Effekt, zentriert. Optional ein Hintergrundbild mit starkem Halftone-Filter (Deckkraft ~15%).

**Slide 2 — Erklärung (4–11s):** Weißer Cutout-Block auf schwarzem Grund (wie Newsjacking Slide 2). Erklärender Text, Typewriter-Aufbau.

**Slide 3 — CTA (11–15s):** Identisch mit Newsjacking Slide 3.

### Typ 4: Contrarian

Identisch mit Newsjacking im Aufbau, aber Slide 1 zeigt kein Screenshot-Bild, sondern ein Zitat/eine verbreitete Meinung als großen Text in Anführungszeichen. Die Reaktion darunter ist die Gegenposition.

### Typ 5: Selbstironie / Meta

Identisch mit "23-Uhr-Gedanke" im visuellen Stil (schwarz, weiß, minimal), aber ohne Uhrzeit. Stattdessen optional ein kleines Label oben ("DEKAN-REPORT", "FUN FACT").

### Typ 6: Bekloppter Witz

Wie "23-Uhr-Gedanke", aber mit **gelber Schrift** statt weißer auf schwarzem Grund. Slide 1 ist die Frage, Slide 2 die Antwort (harter Cut, kein Typewriter — sofort sichtbar für Comedy-Timing), Slide 3 CTA.

---

## Datenmodell

Jeder Post wird als JSON-Datei definiert. Das System liest diese Datei und rendert daraus Video + Carousel-Bilder.

```typescript
interface Post {
  // Metadaten
  id: string;                    // z.B. "2026-03-21-datenskandal"
  type: "newsjacking" | "nachtgedanke" | "wusstest-du" | "contrarian" | "selbstironie" | "witz";
  
  // Inhalt
  category?: string;             // z.B. "SECURITY", "LEHRE", "STADT" — nur für Newsjacking/Wusstest-du
  accentColor?: string;          // Hex, default #FFE500
  
  // Slide 1
  slide1: {
    image?: string;              // Pfad zu Screenshot-Bild (Newsjacking, Wusstest-du)
    time?: string;               // Uhrzeit-String (Nachtgedanke): "23:47"
    label?: string;              // Kleines Label (Selbstironie): "DEKAN-REPORT"
    bigText: string;             // Großer Text / Trigger / Frage
    smallText?: string;          // Kontext-Zeile unter dem großen Text
  };
  
  // Slide 2
  slide2: {
    text: string;                // Punchline-Text. Zeilenumbrüche werden übernommen.
  };
  
  // Slide 3
  slide3: {
    url: string;                 // Link-Target URL
    subtext?: string;            // Beschreibung unter der URL
  };
}
```

### Beispiel: Newsjacking-Post

```json
{
  "id": "2026-03-21-datenskandal",
  "type": "newsjacking",
  "category": "SECURITY",
  "accentColor": "#FF2D2D",
  "slide1": {
    "image": "./assets/screenshots/23andme-spiegel.png",
    "bigText": "Ach.",
    "smallText": "Schon wieder Millionen Datensätze geleakt."
  },
  "slide2": {
    "text": "Bei uns lernst du,\nwarum sowas passiert.\nUnd warum es weiter\npassieren wird."
  },
  "slide3": {
    "url": "studium.wiai.uni-bamberg.de",
    "subtext": "IT-Sicherheit & Datenschutz studieren.\nIn Bamberg. Nicht im Silicon Valley."
  }
}
```

### Beispiel: 23-Uhr-Gedanke

```json
{
  "id": "2026-04-01-pointer",
  "type": "nachtgedanke",
  "slide1": {
    "time": "23:47",
    "bigText": ""
  },
  "slide2": {
    "text": "Die Leute die heute bei Google\narbeiten haben mit 17 auch\nnicht gewusst was ein Pointer ist.\n\nDie Leute die heute Startups\ngründen haben mit 19 auch\nnicht gewusst was ein\nBusiness Model Canvas ist.\n\nAnfangen > Planen."
  },
  "slide3": {
    "url": "studium.wiai.uni-bamberg.de",
    "subtext": "Zulassungsfrei. Einfach einschreiben."
  }
}
```

---

## Design-System

### Farben

| Name | Hex | Verwendung |
|------|-----|------------|
| WIAI Yellow | #FFE500 | Primäre Akzentfarbe, Logo, Default-Akzent |
| Black | #0A0A0A | Hintergrund aller Slides |
| Cream | #F0EDE8 | Punchline-Cutout-Block |
| White | #FFFFFF | Text auf dunklem Grund |
| Dimmed White | rgba(255,255,255,0.45) | Subtext, URLs, sekundäre Info |
| Security Red | #FF2D2D | Akzent für Security-Posts |
| KI Cyan | #00E5FF | Akzent für KI-Posts |
| Stadt Orange | #FF9900 | Akzent für Bamberg/Stadt-Posts |
| Karriere Green | #66FF66 | Akzent für Karriere-Posts |

### Fonts

- **Space Grotesk Bold** — alle Headlines, Punchlines, großer Text
- **Space Mono Regular/Bold** — UI-Elemente, URLs, Labels, Uhrzeiten, WIAI-Branding

Beide Fonts über Google Fonts einbinden. Fallback: system monospace.

### Texturen & Effekte

**Halftone-Dots (Hintergrund):** Feines Dot-Raster (ca. 6–10px Abstand) mit ~4% Deckkraft über dem schwarzen Hintergrund. Dazu größere Dot-Cluster in den Ecken mit Radial-Gradient-Verteilung in der Akzentfarbe (~5–8% Deckkraft). Erstelle diese als SVG-Pattern oder Canvas-basiert.

**Halftone-Filter (Screenshots):** Screenshots auf Slide 1 (Newsjacking) erhalten einen Halftone-Overlay: weißes Dot-Raster (~12% Deckkraft, 6px Spacing) plus Scanline-Effekt (horizontale 1px-Linien alle 3–4px, ~12% Deckkraft). Optional: leichter Kontrast-Boost auf dem Screenshot darunter.

**Glitch-Effekt (Text):** RGB-Offset auf großem Text (Slide 1 bigText). Zwei zusätzliche Text-Layer: einer in Rot (#FF2D2D, Opacity 0.35, versetzt -3px horizontal, +2px vertikal, clip-path auf obere 40%), einer in Cyan (#00E5FF, Opacity 0.3, versetzt +3px horizontal, -1px vertikal, clip-path auf untere 40%). Im Video: kurzes Flackern (2–3 Frames random offset) beim Erscheinen, dann Stabilisierung.

**Dirty Cutout (Punchline-Block):** Der weiße Textblock auf Slide 2 hat keine geraden Kanten, sondern ein unregelmäßiges Polygon als clip-path (leicht abweichende Eckpunkte, z.B. `polygon(0.5% 1%, 98% 0%, 99.5% 2%, 99% 97.5%, 97.5% 99.5%, 1.5% 99%, 0% 97%, 0.5% 2.5%)`). Leichte Rotation (0.3–0.8deg). Dahinter ein farbiger Schatten-Layer (Akzentfarbe, versetzt 6–8px rechts und unten, eigenes leicht anderes Polygon).

### Branding-Footer

Auf jeder Slide unten:

1. Slide-Indicator-Dots (aktive Slide = breiter Balken in Akzentfarbe, inaktive = kleine Punkte in 12% Weiß)
2. "WIAI" in Gelb (#FFE500), Space Mono Bold, 13px, letter-spacing 0.2em
3. "UNI BAMBERG" in gedimmtem Weiß, Space Mono, 8–9px, daneben
4. "@herdom" rechts-aligned, Space Mono, 9px, stark gedimmt

---

## Video-Timing & Animationen

### Gesamtlänge: 15 Sekunden (450 Frames bei 30fps)

| Phase | Frames | Zeit | Inhalt |
|-------|--------|------|--------|
| Act 1 | 0–120 | 0–4s | Slide 1 (Hook) |
| Cut | 120 | 4.0s | Harter Schnitt (kein Fade) |
| Act 2 | 120–330 | 4–11s | Slide 2 (Punchline) |
| Cut | 330 | 11.0s | Harter Schnitt |
| Act 3 | 330–450 | 11–15s | Slide 3 (CTA) |

### Animationen pro Phase

**Act 1 (Hook):**
- Frame 0–5: Schwarzer Screen
- Frame 5–10: Category-Tag erscheint (schnelles Fade-In, 0 → 1 Opacity)
- Frame 10–15: Screenshot-Bild fährt ein (translateY: 20px → 0, opacity 0 → 1) — nur bei Newsjacking
- Frame 15–20: Kontext-Zeile (smallText) faded ein
- Frame 40–50: Glitch-Effekt startet auf bigText (2–3 Frames random RGB-Offset, dann stabilisiert)
- Frame 50–55: bigText steht stabil
- Frame 55–120: Statisch, Leser hat Zeit

**Act 2 (Punchline):**
- Frame 120: Harter Cut zu schwarzem Screen
- Frame 122–128: Weißer Cutout-Block schiebt sich von rechts ein (translateX: 40px → 0, slight rotation settle)
- Frame 130+: Text erscheint Zeile für Zeile. Berechne das Timing automatisch: Gesamttext aufgeteilt auf die verfügbaren Frames (130–310), mit ca. 200ms (6 Frames) Verzögerung pro Zeile. Leerzeilen (doppelter Umbruch) erhalten doppelte Verzögerung.
- Frame 310–330: Alles steht, Leser hat kurz Zeit

**Act 3 (CTA):**
- Frame 330: Cut
- Frame 332–340: "LINK IN BIO" faded ein
- Frame 340–348: URL-Box faded ein
- Frame 350–358: Subtext faded ein
- Frame 420–430: WIAI-Logo kurzer Pulse (scale 1 → 1.05 → 1, opacity pulse)

### Abweichungen pro Post-Typ

- **Nachtgedanke:** Act 1 ist nur die Uhrzeit (langsames Fade-In über 30 Frames, dann 60 Frames statisch). Act 2 beginnt früher (Frame 90 statt 120). Kein harter Cut, sondern Crossfade (15 Frames).
- **Witz:** Act 2 hat keinen Typewriter-Effekt. Der gesamte Text erscheint sofort (Frame 122). Comedy braucht Timing, nicht Aufbau.
- **Selbstironie:** Wie Nachtgedanke, aber ohne Uhrzeit. Optional ein Label-Einblender in Frame 5–10.

---

## CLI-Interface

### Einzelnen Post rendern

```bash
npx remotion render src/index.ts WiaiPost \
  --props="./posts/2026-03-21-datenskandal.json" \
  --output="./out/2026-03-21-datenskandal.mp4"
```

### Carousel-Bilder rendern

```bash
npx remotion still src/index.ts WiaiPost \
  --props="./posts/2026-03-21-datenskandal.json" \
  --frame=60 \
  --output="./out/2026-03-21-datenskandal-slide1.png"

npx remotion still src/index.ts WiaiPost \
  --props="./posts/2026-03-21-datenskandal.json" \
  --frame=200 \
  --output="./out/2026-03-21-datenskandal-slide2.png"

npx remotion still src/index.ts WiaiPost \
  --props="./posts/2026-03-21-datenskandal.json" \
  --frame=390 \
  --output="./out/2026-03-21-datenskandal-slide3.png"
```

### Convenience-Script

Erstelle ein `render.sh`-Script das beides in einem Aufruf macht:

```bash
./render.sh posts/2026-03-21-datenskandal.json
# Erzeugt:
#   out/2026-03-21-datenskandal.mp4
#   out/2026-03-21-datenskandal-slide1.png (1080x1920)
#   out/2026-03-21-datenskandal-slide2.png (1080x1920)
#   out/2026-03-21-datenskandal-slide3.png (1080x1920)
#   out/2026-03-21-datenskandal-carousel1.png (1080x1350)
#   out/2026-03-21-datenskandal-carousel2.png (1080x1350)
#   out/2026-03-21-datenskandal-carousel3.png (1080x1350)
```

Die Carousel-Bilder (1080×1350) sind vertikale Crops der 1080×1920-Slides, zentriert auf den Content-Bereich. Implementiere das als Nachbearbeitung mit sharp oder Canvas.

### Vorschau

```bash
npx remotion preview src/index.ts
```

Öffnet den Remotion-Player im Browser. Dort kann man Posts auswählen und die Animation frame-genau prüfen.

---

## Dateistruktur

```
wiai-social/
├── README.md
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── render.sh                    # Convenience-Script
│
├── src/
│   ├── index.ts                 # Root, registriert Compositions
│   ├── types.ts                 # Post-Interface
│   │
│   ├── compositions/
│   │   ├── WiaiPost.tsx         # Haupt-Composition, routet nach post.type
│   │   ├── Newsjacking.tsx
│   │   ├── Nachtgedanke.tsx
│   │   ├── WusstestDu.tsx
│   │   ├── Contrarian.tsx
│   │   ├── Selbstironie.tsx
│   │   └── Witz.tsx
│   │
│   ├── components/
│   │   ├── SlideFrame.tsx       # Shared: Halftone-BG + Branding-Footer + Slide-Indicators
│   │   ├── GlitchText.tsx       # RGB-Offset-Glitch mit Animation
│   │   ├── DirtyCutout.tsx      # Weißer Block mit unregelmäßigem Clip + Akzent-Schatten
│   │   ├── HalftoneImage.tsx    # Screenshot mit Halftone-Overlay + Scanlines
│   │   ├── TypewriterText.tsx   # Zeile-für-Zeile-Aufbau mit Timing
│   │   ├── BrandingFooter.tsx   # WIAI + UNI BAMBERG + @herdom + Slide-Dots
│   │   └── CtaSlide.tsx         # "Link in Bio" + URL-Box + Subtext
│   │
│   ├── styles/
│   │   ├── colors.ts            # Farbkonstanten
│   │   ├── fonts.ts             # Font-Loading (Space Grotesk, Space Mono)
│   │   └── textures.ts          # Halftone-Pattern-Generatoren (SVG data URIs)
│   │
│   └── utils/
│       ├── timing.ts            # Frame-Berechnungen, Typewriter-Timing
│       └── crop.ts              # 1920→1350 Crop-Logik für Carousel
│
├── posts/                       # JSON-Dateien, eine pro Post
│   ├── 2026-03-21-datenskandal.json
│   ├── 2026-04-01-pointer.json
│   └── ...
│
├── assets/
│   └── screenshots/             # Screenshot-Bilder für Newsjacking-Posts
│       └── 23andme-spiegel.png
│
└── out/                         # Generierte Dateien (gitignored)
    ├── 2026-03-21-datenskandal.mp4
    ├── 2026-03-21-datenskandal-slide1.png
    └── ...
```

---

## Output-Spezifikationen

| Output | Auflösung | Format | Verwendung |
|--------|-----------|--------|------------|
| Video | 1080×1920 | MP4 H.264, 30fps, 15s | TikTok, YouTube Shorts, Instagram Reels |
| Story-Slides | 1080×1920 | PNG | Instagram Stories, einzelne Slides |
| Carousel-Slides | 1080×1350 | PNG | Instagram Carousel Posts |

### Video-Encoding

```
Codec: H.264
Pixel Format: yuv420p
CRF: 18 (hohe Qualität)
Audio: keine (Sound wird in der App hinzugefügt)
```

---

## Beispiel-Posts zum Testen

Lege beim Setup diese drei Test-Posts an:

### Test 1: Newsjacking (alle Features)

```json
{
  "id": "test-newsjacking",
  "type": "newsjacking",
  "category": "SECURITY",
  "accentColor": "#FF2D2D",
  "slide1": {
    "image": "./assets/screenshots/test-headline.png",
    "bigText": "Überraschend\nist das nicht.",
    "smallText": "Schon wieder Millionen Datensätze geleakt."
  },
  "slide2": {
    "text": "Bei uns lernst du,\nwarum sowas passiert.\nUnd warum es weiter\npassieren wird."
  },
  "slide3": {
    "url": "studium.wiai.uni-bamberg.de",
    "subtext": "IT-Sicherheit & Datenschutz studieren.\nIn Bamberg. Nicht im Silicon Valley."
  }
}
```

Erstelle ein Placeholder-Screenshot-Bild (1080×600, dunkelgrauer Hintergrund, weiße Überschrift "23andMe meldet Insolvenz: DNA-Daten von 15 Mio. Nutzern stehen zum Verkauf", kleine Quellenangabe "SPIEGEL.DE") als Test-Asset.

### Test 2: 23-Uhr-Gedanke (minimalistisch)

```json
{
  "id": "test-nachtgedanke",
  "type": "nachtgedanke",
  "slide1": {
    "time": "23:47",
    "bigText": ""
  },
  "slide2": {
    "text": "Du musst nicht wissen\nwas du mit deinem Leben\nmachen willst.\n\nDu musst nur wissen\nwas du nächstes Semester\nausprobieren willst.\n\nDer Rest ergibt sich.\nOder auch nicht.\nBeides ist okay."
  },
  "slide3": {
    "url": "studium.wiai.uni-bamberg.de",
    "subtext": "Alle Bachelorstudiengänge sind zulassungsfrei."
  }
}
```

### Test 3: Bekloppter Witz (Comedy-Timing)

```json
{
  "id": "test-witz",
  "type": "witz",
  "slide1": {
    "bigText": "WER IST CLEVER\nUND SITZT NICHT\nIM HÖRSAAL?"
  },
  "slide2": {
    "text": "Tim.\n\nTim studiert an der WIAI.\nDa geht das oft auch\nvon zu Hause aus."
  },
  "slide3": {
    "url": "studium.wiai.uni-bamberg.de",
    "subtext": "Flexibel studieren. Wie Tim."
  }
}
```

---

## Nicht in Scope (v1)

- Audio/Voiceover-Integration (wird in der TikTok/Instagram-App hinzugefügt)
- Automatisches Posting via API
- Automatisches Screenshot-Capture von URLs
- A/B-Testing verschiedener Textvarianten
- Analytics-Dashboard
- Batch-Rendering aller Posts auf einmal (nice-to-have für v2)

---

## Akzeptanzkriterien

1. `./render.sh posts/test-newsjacking.json` erzeugt ein 15s MP4 und 6 PNG-Dateien ohne Fehler.
2. Das Video zeigt drei klar getrennte Acts mit harten Cuts.
3. Der Glitch-Effekt auf Slide 1 flackert kurz und stabilisiert sich.
4. Der Typewriter-Effekt auf Slide 2 baut Text zeilenweise auf mit sichtbarer Verzögerung.
5. Alle drei Test-Posts rendern korrekt mit ihren jeweiligen visuellen Stilen.
6. `npx remotion preview` zeigt eine funktionierende Vorschau mit allen Post-Typen.
7. Fonts (Space Grotesk, Space Mono) werden korrekt geladen und angezeigt.
8. Die Halftone-Textur ist im Video sichtbar (nicht nur im Still).
9. Carousel-Bilder (1080×1350) sind korrekt auf den Content-Bereich gecroppt.
10. Das gesamte Setup inklusive `npm install` funktioniert auf macOS mit Node 20+.
