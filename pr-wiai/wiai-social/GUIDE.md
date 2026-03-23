# WIAI Social Video Generator — Guide

## Neuen Post erstellen

### 1. JSON-Datei anlegen

Erstelle `posts/mein-post.json`:

```json
{
  "id": "mein-post",
  "type": "contrarian",
  "accentColor": "#FACC15",
  "slide1": {
    "bigText": "Aha.",
    "smallText": "Irgendein Statement."
  },
  "slide2": {
    "text": "Die Erklärung\nwarum das so ist."
  },
  "slide3": {
    "text": "Die Pointe.",
    "button": "Optionaler Nachsatz."
  }
}
```

### 2. In Root.tsx registrieren

```tsx
import meinPost from "../posts/mein-post.json";
// ...
{cp("WiaiPost-mein-post", meinPost as unknown as Post)}
```

### 3. Preview

```bash
npm run preview
```

Composition im Dropdown links auswählen. Safe-Zone-Overlay zeigt die verbotenen Zonen (nur im Studio sichtbar, nicht im Render).

---

## Post-Felder

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ja | Eindeutiger Bezeichner |
| `type` | ja | `"contrarian"` (weitere: `"nachtgedanke"`, `"witz"`, `"newsjacking"`) |
| `accentColor` | ja | Hex-Farbe (`"#FACC15"` gelb, `"#EF4444"` rot, `"#3B82F6"` blau, `"#22C55E"` grün, `"#8B5CF6"` lila, `"#F97316"` orange, `"#F0EDE8"` creme) |
| `isAd` | nein | Legacy-Feld, wird nicht mehr gebraucht |
| `slide1.bigText` | nein | Reaktionswort ("Aha.", "Stimmt."). Leer lassen wenn kein Reaktionswort passt. Font skaliert automatisch nach Länge. Mehrzeilig mit `\n` möglich. |
| `slide1.smallText` | nein | Setup-Zitat. Anführungszeichen selbst setzen wenn gewünscht (`\u201C` / `\u201D`). |
| `slide2.text` | ja | Erklärungstext. Zeilenumbrüche mit `\n`. Leerzeilen mit `\n\n`. |
| `slide3.text` | ja | Pointe/Abschluss. |
| `slide3.button` | nein | Gedimmter Nachsatz unter der Pointe. |
| `slide3.übrigensText` | nein | Alternative zu button, mit "ÜBRIGENS…"-Label. |
| `slide3.url` | nein | CTA-URL unter button/übrigensText. |

## Text-Formatierung

- **Zeilenumbrüche**: `\n` im JSON-String
- **Absätze**: `\n\n` (erzeugt Leerzeile im Typewriter)
- **Max. Zeichenlänge**: Auto-Wrap ist aktiv, aber für sauberes Layout:
  - slide2 (fontSize 78): ~18 Zeichen/Zeile
  - slide1.smallText (fontSize 72): ~22 Zeichen/Zeile
  - slide3.text (fontSize 84): ~15 Zeichen/Zeile
  - slide3.button (fontSize 48): ~30 Zeichen/Zeile
- **Lange Wörter** (z.B. "Kommunikationsproblem"): als Fließtext schreiben, Auto-Wrap bricht innerhalb des Worts

---

## Timing (optional)

Die meisten Posts brauchen kein Timing — Defaults werden automatisch berechnet:
- **act1Duration**: 150 Frames (5s) mit bigText, 100 Frames (3.3s) ohne
- **subtextStartFrame / absenderStartFrame**: automatisch, je nach Act3-Länge

Wenn du etwas anpassen willst, füge `timing` zum JSON hinzu:

```json
"timing": {
  "variant": "through-scratch",
  "act1Duration": 225
}
```

### Musik-Varianten (`variant`)

| Wert | Verhalten | Wann nutzen |
|---|---|---|
| `"scratch"` | Musik fadet langsam aus, Vinyl-Scratch, Beat-Sync in Act3 | Default. Dramatischer Aufbau. |
| `"through"` | Musik läuft einfach durch, kein Scratch | Kurzer Act2. Video endet wenn Musik endet. |
| `"through-scratch"` | Musik volle Lautstärke, Scratch am Act2-Ende, Beat-Sync Act3 | Langer Act2. Musik bleibt energetisch. |

### Weitere Timing-Felder

| Feld | Default | Beschreibung |
|---|---|---|
| `act1Duration` | 150/100 | Frames für Act1. 225 = 7.5s für lange Zitate. |
| `act3Track` | — | Alt-Musik für Act3: `"a"` bis `"f"`. Nur mit through-scratch. |
| `act3MusicDelay` | 0 | Frames Verzögerung für Act3-Musik (halb-Overlap mit Scratch). |
| `scratchOffset` | 15 | Frames vor Act3-Start wo Scratch beginnt. 0 = genau bei Act3. |

---

## Rendern

```bash
# Einzelnes Video
npx remotion render src/index.ts WiaiPost-mein-post \
  --output=out/mein-post.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p

# Story-Stills (1080x1920)
npx remotion still src/index.ts WiaiPost-mein-post \
  --frame=60 --output=out/mein-post-slide1.png
```

---

## Dateistruktur

```
wiai-social/
├── posts/              ← Post-JSONs (Single Source of Truth)
├── assets/music/       ← Musik-Dateien (track.mp3, vinyl-rewind.mp3, track-act3-*.mp3)
├── src/
│   ├── Root.tsx        ← Composition-Registry (1 Zeile pro Post)
│   ├── types.ts        ← Post + ContrarianTiming Typen
│   ├── compositions/   ← Contrarian.tsx, Nachtgedanke.tsx, etc.
│   ├── components/     ← TypewriterText, PunchlineSlide, SafeZoneOverlay, etc.
│   ├── styles/         ← colors.ts, fonts.ts, safeZones.ts
│   └── utils/          ← timing.ts (computeAct2Duration, ACT3_ALT_TRACKS)
└── GUIDE.md            ← Diese Datei
```
