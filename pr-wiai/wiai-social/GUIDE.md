# WIAI Social Video Generator — Guide

## Neuen Post erstellen

### 1. Content in plan.json schreiben

Per Pipeline-UI (`node pipeline/server.mjs`) oder CLI (`node edit.mjs`).

### 2. Exportieren

```bash
node export-post.mjs --list              # Exportierbare Posts anzeigen
node export-post.mjs <post-id> --dry-run # Vorschau
node export-post.mjs <post-id>           # Export: JSON + Root.tsx-Eintrag
```

Der Export:
- Schreibt `wiai-social/posts/<id>.json` (Remotion-Input)
- Fuegt Import + `cp()` in `Root.tsx` ein (Marker-basiert)
- Setzt `status=ready` in plan.json

### 3. Preview

```bash
cd wiai-social && npm run preview
```

Composition im Dropdown links auswaehlen. Safe-Zone-Overlay zeigt die verbotenen Zonen (nur im Studio sichtbar, nicht im Render).

### 4. Rendern

```bash
cd wiai-social && ./render.sh posts/<id>.json
```

Output:
- `out/<id>.mp4` — Video (H.264, muted)
- `out/<id>-slide{1,2,3}.png` — Story-Stills (1080x1920)
- `out/<id>-carousel{1,2,3}.png` — Carousel-Crops (1080x1350)

**Wichtig:** render.sh nutzt die spezifische Composition `WiaiPost-<id>` aus Root.tsx. Der Post muss vorher exportiert sein (Schritt 2).

---

## Post-Felder (Remotion JSON)

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ja | Eindeutiger Bezeichner |
| `type` | ja | `"led-wall"` \| `"billboard"` \| `"terminal"` \| `"newsjacking"` \| `"slideshow"` \| `"nachtgedanke"` \| `"selbstironie"` \| `"wusstest-du"` \| `"witz"` |
| `accentColor` | nein | Hex-Farbe (`"#FACC15"` gelb, `"#EF4444"` rot, `"#3B82F6"` blau, `"#22C55E"` gruen, `"#8B5CF6"` lila, `"#F97316"` orange, `"#F0EDE8"` creme) |
| `content.act1Setup` | nein | Setup-Zitat (led-wall/billboard) oder Prompt (terminal, z.B. `"$ 23:47"`). Leer lassen wenn kein Setup passt. |
| `content.act1Reveal` | nein | Reaktionswort ("Aha.", "Stimmt."). Nur led-wall/billboard. Font skaliert automatisch. |
| `content.act2` | ja | Haupttext. Zeilenumbrueche mit `\n`. Leerzeilen mit `\n\n`. |
| `content.act3` | ja | Pointe/Abschluss. |
| `content.aside` | nein | Nachsatz/CTA unter der Pointe. |
| `content.asideStyle` | nein | `"button"` (default) oder `"uebrigens"`. |
| `content.url` | nein | CTA-URL unter aside. |

## Text-Formatierung

- **Zeilenumbrueche**: `\n` im JSON-String
- **Absaetze**: `\n\n` (erzeugt Leerzeile im Typewriter)
- **Max. Zeichenlaenge**: Auto-Wrap ist aktiv, aber fuer sauberes Layout:
  - act2 (fontSize 78): ~18 Zeichen/Zeile
  - act1Setup (fontSize 72): ~22 Zeichen/Zeile
  - act3 (fontSize 84): ~15 Zeichen/Zeile
  - aside/button (fontSize 48): ~30 Zeichen/Zeile
- **Lange Woerter** (z.B. "Kommunikationsproblem"): als Fliesstext schreiben, Auto-Wrap bricht innerhalb des Worts

---

## Timing (optional)

Die meisten Posts brauchen kein Timing — Defaults werden automatisch berechnet:
- **act1Duration**: 150 Frames (5s) mit act1Reveal, 100 Frames (3.3s) ohne
- **act2**: automatisch nach Textlaenge (Typewriter-Speed + Lesepuffer)
- **act3**: automatisch nach Punchline-Laenge

Wenn du etwas anpassen willst, fuege `timing` zum JSON hinzu:

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
| `"through"` | Musik laeuft einfach durch, kein Scratch | Kurzer Act2. Video endet wenn Musik endet. |
| `"through-scratch"` | Musik volle Lautstaerke, Scratch am Act2-Ende, Beat-Sync Act3 | Langer Act2. Musik bleibt energetisch. |

### Weitere Timing-Felder

| Feld | Default | Beschreibung |
|---|---|---|
| `act1Duration` | 150/100 | Frames fuer Act1. 225 = 7.5s fuer lange Zitate. |
| `act3Track` | — | Alt-Musik fuer Act3: `"a"` bis `"f"`. Nur mit through-scratch. |
| `act3MusicDelay` | 0 | Frames Verzoegerung fuer Act3-Musik (halb-Overlap mit Scratch). |
| `scratchOffset` | 15 | Frames vor Act3-Start wo Scratch beginnt. 0 = genau bei Act3. |

---

## Dateistruktur

```
wiai-social/
├── posts/                  ← Neue Post-JSONs (nach Export)
│   └── archive/
│       ├── prelaunch/      ← Vorhandene Referenz-Posts (36 Stueck)
│       └── test/           ← Design-Varianten + FX-Tests (32 Stueck)
├── assets/music/           ← Musik-Dateien (track.mp3, vinyl-rewind.mp3, track-act3-*.mp3)
├── src/
│   ├── Root.tsx            ← Composition-Registry (Marker-basiert, export-post.mjs fuegt ein)
│   ├── types.ts            ← Post + ContrarianTiming Typen
│   ├── compositions/       ← LedWall, Billboard, Terminal, Slideshow, etc.
│   ├── components/         ← TypewriterText, PunchlineSlide, SafeZoneOverlay, etc.
│   ├── styles/             ← colors.ts, fonts.ts, safeZones.ts
│   └── utils/              ← timing.ts (Duration-Berechnung)
├── render.sh               ← Video + Stills + Carousel rendern
├── crop.mjs                ← Carousel-Crop (1920→1350 Hoehe)
├── GUIDE.md                ← Diese Datei
└── CONTENT.md              ← Visual Designs + Farb-Palette
```

## Root.tsx Marker-System

`export-post.mjs` fuegt neue Posts per Marker-Kommentaren ein:

- `// @export-post:imports-end` — Neue Imports werden davor eingefuegt
- `{/* @export-post:compositions-end */}` — Neue `cp()` Zeilen werden davor eingefuegt

Diese Marker nicht entfernen oder umbenennen.
