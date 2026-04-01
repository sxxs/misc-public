# WIAI Social — Content-Erstellungs-Guide

## Systemübersicht

```
posts/                ← Neue Post-JSONs (nach Export via export-post.mjs)
posts/archive/
  prelaunch/          ← Referenz-Posts aus der Entwicklungsphase
  test/               ← Design-Varianten + Effekt-Tests
src/Root.tsx          ← Composition-Registry (Marker-basiert, export-post.mjs fuegt ein)
src/compositions/     ← Composition-Templates (= Visual Designs)
  LedWall.tsx         ← LED-Raster: Quote → Reaktion → Argument → Punchline (ehem. Contrarian.tsx)
  Billboard.tsx       ← Schwarz-weiß, große Typo, Fade-In (+ Captions-Modus)
  Terminal.tsx        ← CRT-Monospace, Typing-Animation (+ Flow-Modus mit Pausen)
  Newsjacking.tsx     ← News-Screenshot + Halftone → Kommentar → Punchline
  Slideshow.tsx       ← Foto-basiert mit Pixelation/Saturierung-Effekten
  Nachtgedanke.tsx    ← Uhrzeit → Gedankenfluss → Closing
  Selbstironie.tsx    ← Selbstkritischer Witz
  WusstestDu.tsx      ← Wusstest-du-Fakten
  Witz.tsx            ← Setup → Punchline
src/components/       ← Shared UI
  LedWall.tsx         ← LED-Raster-Background (s1/s2/s3 Modi)
  PunchlineSlide.tsx  ← Slide 3 (alle Typen)
  TypewriterText.tsx  ← Typewriter-Animation mit Bounding Boxes
  GlitchText.tsx      ← Grosser Glitch-Text (Reaktion in S1)
  DirtyCutout.tsx     ← Schmutziger Rahmen fuer Slide-2-Text
  PhotoFrame.tsx      ← Foto mit Effekten (Pixelation, Saturierung, Tint)
  CaptionSequence.tsx ← Billboard-Captions: Rapid Cuts
  TerminalFlow.tsx    ← Terminal-Flow: Durchgehender Text mit Pausen
src/utils/timing.ts   ← Dauer-Berechnung
src/styles/colors.ts  ← Farb-Konstanten
```

---

## Visual Designs (Remotion Compositions)

Das `design`-Feld in plan.json bestimmt welche Remotion-Composition genutzt wird:

### `led-wall` (design: pixel-wall)
**Ablauf:** Quote (S1) → Reaktionswort mit Glitch → Argument (S2, Typewriter) → Punchline (S3)
**Hintergrund:** 24×48 LED-Raster, Glitch-Effekte, Musik mit Beat-Sync
**Fuer:** contrarian, parodie, overselling, wusstest-du, merkste-selber

### `billboard` (design: billboard)
**Ablauf:** Hook-Text (S1) → Argument (S2, Fade) → Punchline (S3, Glow)
**Hintergrund:** Reines Schwarz, keine LEDs
**Captions-Modus:** Wenige Wörter gleichzeitig, harte Cuts, Zeitungsausschnitt-Look
**Fuer:** aphorismus, merkste-selber

### `terminal` (design: terminal)
**Ablauf:** Prompt (S1, Cursor blinkt) → Typing (S2, Zeichen fuer Zeichen) → Closing (S3)
**Hintergrund:** CRT-Scanlines, Monospace, Glow
**Flow-Modus:** Ein durchgehender Text mit eingebauten Pausen statt 3 Slides
**Farben:** green (#33FF33), amber (#FFB000), white
**Fuer:** nahkastchen, nachtgedanke, selbstironie

### `newsjacking` (design: newsjacking)
**Ablauf:** News-Screenshot + Glitch (S1) → Kommentar (S2) → Punchline (S3)
**Hintergrund:** Halftone + Film Grain + Scanlines

### `slideshow` (design: raw-photo)
**Ablauf:** Foto(s) mit digitalen Effekten + optionalem Text-Overlay
**Effekte:** depixelate, pixelate, pixel-strips, saturate, desaturate, tint, drift
**Fuer:** Stress-Bilder, Campus-Slideshows, Ertappt-Fotos

---

## Content-Typen (rhetorischer Ansatz)

Der `type` in plan.json beschreibt WIE der Post aufgebaut ist (unabhaengig vom visuellen Design):

| Type | Beschreibung | Typisches Design |
|------|-------------|-----------------|
| contrarian | Gegenposition, "Es wird ja immer gesagt..." | pixel-wall |
| merkste-selber | Denkanstoß → "Merkste selber, oder?" | billboard / pixel-wall |
| aphorismus | Kurze Beobachtung, keine Moral | billboard |
| wusstest-du | Erklaer-Post, ueberraschende Fakten | pixel-wall |
| parodie | Clickbait/Marketing-Mechanik entlarven | pixel-wall |
| overselling | Absurde Marketing-Parallelen | pixel-wall |
| nachtgedanke | 23-Uhr-Gedanke, verletzlich, persoenlich | terminal (amber) |
| nahkastchen | Persoenliche Anekdote, kafkaesk, "Ich habe Fragen" | terminal (green) |
| selbstironie | Kanal reflektiert eigene Absurditaet | terminal |
| newsjacking | Aktuelle Nachricht + herdom-Kommentar | newsjacking |
| stitch | Reaction auf virales TikTok | App-nativ |
| witz | Setup → Punchline | pixel-wall |

---

## Parameter-Referenz

```jsonc
{
  // ── Meta ─────────────────────────────────────────────────────────
  "id": "2026-03-vorhange",                 // eindeutige ID (kebab-case)
  "type": "led-wall",                      // s. Visual Designs oben (led-wall/billboard/terminal/newsjacking/slideshow)
  "accentColor": "#FACC15",               // s. Farb-Palette unten
  "isAd": true,                           // Absender in S3 anzeigen (nur bei #ad-Posts)

  // ── Slide 1 ──────────────────────────────────────────────────────
  "slide1": {
    "bigText": "Aha.",                    // Reaktion — gross, Glitch-Animation
    "smallText": "Ich hab nichts zu verbergen.", // [contrarian] Quote des Gegners
    "image": "./assets/screenshots/news.png"    // [newsjacking] Hintergrundbild
    //        Genau eines: smallText ODER image
  },

  // ── Slide 2 ──────────────────────────────────────────────────────
  "slide2": {
    "text": "Du hast Vorhänge\nan deinen Fenstern."
    //       \n = neue Zeile; Leerzeile (\n\n) = längere Pause
  },

  // ── Slide 3 ──────────────────────────────────────────────────────
  "slide3": {
    "text": "Merkste selber, oder?",       // Punchline — Pflichtfeld
    "button": "Unsere Seminarräume haben keine Vorhänge.\nWas das jetzt heißt weiß ich auch nicht.",
    //         optional: Comedian-Tag, erscheint gedimmt — KEIN Label
    "übrigensText": "Wir haben noch 12 freie Plätze.\nBewerbungsschluss: 15. März.",
    //               optional: Aside MIT Label "ÜBRIGENS…" in Accent-Farbe davor
    //               Entweder button ODER übrigensText — nicht beide gleichzeitig
    "url": "wiai25.de"
    //      optional: kleine URL unter button/übrigensText
  }
}
```

---

## Farb-Palette

| Konstante     | Hex       | Einsatz                        |
|---------------|-----------|--------------------------------|
| `WIAI_YELLOW` | `#FACC15` | Standard — energetisch, WIAI   |
| `WIAI_RED`    | `#EF4444` | Alarm-Themen, Kritik           |
| `WIAI_BLUE`   | `#3B82F6` | Tech/KI-Themen, sachlich       |
| `WIAI_WHITE`  | `#F0EDE8` | Ruhige, emotionale Posts       |

---

## Durations-Guide

### Act 1 — fix: 75 Frames = 2,5 s
Zeigt Quote + Reaktion. Immer gleich lang, kein Handlungsbedarf.

### Act 2 — auto: `computeAct2Duration(slide2.text)`

| Textlänge              | Frames | Sekunden |
|------------------------|--------|----------|
| 1–2 Zeilen (kurz)      | ~96 f  | ~3,2 s   |
| 3–4 Zeilen (mittel)    | ~105 f | ~3,5 s   |
| 5–6 Zeilen + Leerzeile | ~114 f | ~3,8 s   |

Formel: `max(90, startFrame=10 + Zeilen×3f + Leerzeilen×6f + Lesepuffer=80f)`

### Act 3 — auto: `computeAct3Duration(slide3.text, slide3.button?)`

Formel: `max(150, 150 + 4f × PunchlineWörter + 3f × ButtonWörter)`

| Beispiel                                         | Frames | Sekunden |
|--------------------------------------------------|--------|----------|
| Kurze Punchline, kein Button (3 Wörter)          | 162 f  | 5,4 s    |
| Mittlere Punchline + 1-Zeiler Button (~8 Wörter) | 182 f  | 6,1 s    |
| Standard: 3w Punchline + 2-Zeiler Button (13w)   | 201 f  | 6,7 s    |
| Langer Button (20 Wörter)                        | 222 f  | 7,4 s    |

**Faustregeln:**
- Jedes Wort in der Punchline: +0,13 s Lesezeit
- Jedes Wort im Button: +0,10 s Lesezeit
- Kein Button? Min. 5 s (150 f) — ausreichend für kurze Punchlines

---

## Neuen Post anlegen (Schnell-Workflow)

1. `posts/<datum>-<id>.json` anlegen (Template unten kopieren)
2. In `src/Root.tsx`: neues `<Composition id="WiaiPost-<id>" ... defaultProps={...} />`
3. `./studio.sh` starten → im Studio scrubben
4. Wenn ok: `./render.sh posts/<datum>-<id>.json`

### Template: LED Wall (Pixel Wall)

```json
{
  "id": "2026-MM-DD-stichwort",
  "type": "led-wall",
  "accentColor": "#FACC15",
  "slide1": {
    "bigText": "Reaktion.",
    "smallText": "Der Satz, den man immer hoert."
  },
  "slide2": {
    "text": "Zeile eins.\nZeile zwei."
  },
  "slide3": {
    "text": "Kurze Punchline.",
    "button": "Optionaler Follow-up.\nKann mehrzeilig sein.",
    "url": "wiai25.de"
  }
}
```

### Template: Newsjacking

```json
{
  "id": "2026-MM-DD-stichwort",
  "type": "newsjacking",
  "accentColor": "#FACC15",
  "isAd": false,
  "slide1": {
    "image": "./assets/screenshots/dateiname.png",
    "bigText": "Reaktion.",
    "smallText": "Kontext-Zeile (optional)"
  },
  "slide2": {
    "text": "Erklärung.\nMehrzeilig ok."
  },
  "slide3": {
    "text": "Punchline.",
    "button": "Optionaler Follow-up."
  }
}
```

---

## S3 — Slide-3-Ablauf (PunchlineSlide)

```
Frame  0–8    Container fade-in
Frame  5+     Punchline-Text baut sich auf (TypewriterText)
Frame 52–68   Button + URL faden ein (subtextOpacity)
Frame 82–112  Absender faded ein (langsam, letzte Schicht)
Frame dur-16  Glitch beginnt: Text shiftet + Chromatic Aberration
Frame dur-12  Fade-out beginnt + LED-Flash (brightness 7x, blur 55px, bloom 85%)
Frame dur-8   Burn-to-yellow Overlay startet (accentColor, 0→100% Opacity)
Frame dur-6   Flash/Overpower auf Maximum
Frame dur-1   Letzter Frame: solides Gelb (voller Burn-Overlay)
```

---

## LED-Wall Modi

| Modus | Einsatz     | Helligkeit               | Glitch     |
|-------|-------------|--------------------------|------------|
| `s1`  | Contrarian S1 | 20% an, 15% blinkend, 65% aus | subtil   |
| `s2`  | Act 2       | fast alles aus (0.03)    | kein       |
| `s3`  | Act 3       | fast alles an (0.78)     | intensiv   |

Transition s1→s2: LEDs staggered ausfaden (18 Frames, hash-basiert)
Transition s2→s3: LEDs staggered einblenden (18 Frames, enterFrames-Prop)

---

## Noch offen / geplant

| Feature               | Status  | Notiz                                                  |
|-----------------------|---------|--------------------------------------------------------|
| `übrigensText`        | fertig  | Alternativ zu `button` — zeigt "ÜBRIGENS…" in Accent-Farbe als Label        |
| Scanlines optional    | geplant | In Newsjacking bereits hardcoded; `scanlines?: boolean` als Prop |
| Farbe zufällig wählen | geplant | Wahlweise automatisch aus Palette ziehen               |
| Render-Script         | vorhanden | `./render.sh posts/<datei>.json`                     |
| Studio-Script         | vorhanden | `./studio.sh`                                        |
