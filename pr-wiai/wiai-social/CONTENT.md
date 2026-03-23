# WIAI Social — Content-Erstellungs-Guide

## Systemübersicht

```
posts/*.json          ← Post-Daten (hier befüllen)
src/Root.tsx          ← Compositions registrieren (einmalig pro neuem Post-Typ)
src/compositions/     ← Composition-Templates
  Contrarian.tsx      ← Quote → Reaktion → Erklärung → Punchline
  Newsjacking.tsx     ← News-Screenshot → Reaktion → Erklärung → Punchline
  Nachtgedanke.tsx    ← Uhrzeit → Gedankenfluss → Closing
  Witz.tsx            ← Setup → Punchline
  Selbstironie.tsx    ← Selbstkritischer Witz über die Uni
  WusstestDu.tsx      ← Wusstest-du-Fakten
src/components/       ← Shared UI
  LedWall.tsx         ← LED-Raster-Background (s1/s2/s3 Modi)
  PunchlineSlide.tsx  ← Slide 3 (alle Typen)
  TypewriterText.tsx  ← Typewriter-Animation mit Bounding Boxes
  GlitchText.tsx      ← Grosser Glitch-Text (Reaktion in S1)
  DirtyCutout.tsx     ← Schmutziger Rahmen für Slide-2-Text
src/utils/timing.ts   ← Dauer-Berechnung (computeAct2Duration, computeAct3Duration)
src/styles/colors.ts  ← Farb-Konstanten
```

---

## Post-Typen

### `contrarian`
**Ablauf:** Quote des Gegners (S1) → einzeilige Reaktion mit Glitch → Erklärung (S2, Typewriter) → Punchline (S3)
**Hintergrund:** LED-Wall auf allen drei Slides

### `newsjacking`
**Ablauf:** News-Screenshot mit Glitch-Effekten (S1) → Reaktion → Erklärung (S2) → Punchline (S3)
**Hintergrund:** Bild mit Chromatic Aberration + Film Grain + Scanlines (bereits implementiert)

### `nachtgedanke`
**Ablauf:** Uhrzeit (S1) → langer nachdenklicher Text (S2) → kurzes Closing (S3)

### `witz`
**Ablauf:** Setup-Frage (S1) → Auflösung (S2) → Punchline (S3)

---

## Parameter-Referenz

```jsonc
{
  // ── Meta ─────────────────────────────────────────────────────────
  "id": "2026-03-contrarian-vorhange",     // eindeutige ID (kebab-case)
  "type": "contrarian",                    // s. Post-Typen oben
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

### Template: Contrarian

```json
{
  "id": "2026-MM-DD-stichwort",
  "type": "contrarian",
  "accentColor": "#FACC15",
  "isAd": true,
  "slide1": {
    "bigText": "Reaktion.",
    "smallText": "Der Satz, den man immer hört."
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
Frame dur-12  Fade-out beginnt + LED-Flash
Frame dur-6   Flash/Fade fertig, nur noch volle LED-Wall
Frame dur     Ende
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
