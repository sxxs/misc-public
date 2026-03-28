# Design-System

> **Quelle:** archiv/prds/prd-design-varianten.md + strategie-v2.md §4

---

## Farben

### Grundregel

Jeder Post hat genau **eine** Akzentfarbe auf schwarzem Grund mit weissem Text.

```
Schwarz (#0A0A0A)   -- immer Hintergrund
Weiss (#FFFFFF)      -- immer Textfarbe
Akzentfarbe          -- variiert nach Design und Thema
```

### WIAI-Farben

| Name | Hex | Einsatz |
|------|-----|---------|
| WIAI_YELLOW | `#FACC15` | Default, LED-Sprites, Billboard-Glow |
| WIAI_RED | `#EF4444` | Alarm, Ertappt, Fake-Statistik |
| WIAI_BLUE | `#3B82F6` | KI-Themen, Zukunft |
| WIAI_WHITE | `#F0EDE8` | Ruhige Posts, Nachtgedanken |

### Terminal-Farben

| Name | Hex | Einsatz |
|------|-----|---------|
| TERMINAL_GREEN | `#33FF33` | Hacker, IT-Sicherheit, Social Engineering |
| TERMINAL_AMBER | `#FFB000` | Nachtgedanken, Warnungen |

## Fonts

| Font | Gewicht | Einsatz |
|------|---------|---------|
| **Space Grotesk** | 700 | Haupttext (Billboard), Headlines |
| **Space Mono** | 400 | Terminal-Text, Footer, Monospace-Elemente |

## Die drei Design-Varianten

### 1. Pixel Wall (LED-Grid)

| Eigenschaft | Detail |
|-------------|--------|
| Visueller Kern | 24x48 LED-Grid mit Retro-Sprite-Patterns |
| Grid-Signal | Erkennbares Muster in Gelb/Farbe auf dunklem Grund |
| Akzentfarbe | WIAI_YELLOW (default), WIAI_RED, WIAI_BLUE, WIAI_WHITE |
| Einsatz | Contrarian, Ertappt, Gaming, WusstestDu |
| Effekte | Glitch, Overdrive, Mic-Drop-Flash, Staggered Enter/Exit |

**Patterns:** pacman, space-invader, maze, lock, eye, heartbeat, binary-rain (+ weitere nach Bedarf)

**Sprite-Opacity:**
- S1: 0.45 (sichtbar, gedimmt)
- S2: 0.06 (kaum sichtbar)
- S3: 0.92 (hell, leuchtet auf)

### 2. Terminal (Monospace)

| Eigenschaft | Detail |
|-------------|--------|
| Visueller Kern | Monospace-Text, blinkender Block-Cursor, zeichenweises Tippen |
| Grid-Signal | Grün oder Amber auf Schwarz |
| Hintergrund | Schwarz + dezente Scanlines (Opacity 0.06) |
| Cursor | `Block` (530ms on/off), Farbe = Textfarbe |
| Typing-Speed | 2 Frames/Zeichen, gelegentlich 3 (menschliches Tippen) |
| Einsatz | Nachtgedanke, Social Engineering, Selbstzerstörung, "Ich habe Fragen" |

**Farbmodi:**

| Modus | Hex | Wann |
|-------|-----|------|
| Green | `#33FF33` | Hacker, IT-Sicherheit |
| Amber | `#FFB000` | Nachtgedanken, Warnungen |
| White | `#FFFFFF` | Neutral, allgemein |

### 3. Billboard (nur Text)

| Eigenschaft | Detail |
|-------------|--------|
| Visueller Kern | Nur grosser Text, maximaler Negativraum |
| Grid-Signal | Fast nur Schwarz mit weissem Text |
| Hintergrund | Reines Schwarz, keine Textur, keine Scanlines |
| Font | Space Grotesk 700, 96-120px |
| Akzentfarbe | Immer WIAI_YELLOW, nur als Glow auf S3 |
| Einsatz | Merkste selber, Unpopular Opinion, Aphorismen |

**Gelb-Glow (nur S3):** `text-shadow: 0 0 60px rgba(250, 204, 21, 0.12)`

## Wann welches Design

| Situation | Design |
|-----------|--------|
| Thematischer Post mit Argument | Pixel Wall |
| Gaming, Hacker, KI | Pixel Wall |
| Nachdenklich, spät, persönlich | Terminal |
| IT-Sicherheit als Anekdote | Terminal |
| Kurze Aussage, max. 2-3 Sätze/Slide | Billboard |
| Unpopular Opinion, Merkste selber | Billboard |
| Stress-Bilder | App-nativ (kein Design) |
| Stitches/Duette | App-nativ |

## 3-Slide-Dramaturgie

| Slide | Funktion | Regel |
|-------|----------|-------|
| **S1** | Hook -- Provokation, Behauptung, Zitat | Keine WIAI-Referenz, nie |
| **S2** | Twist oder Argument | Keine WIAI-Referenz, nie |
| **S3** | Punch -- Mic Drop, "Merkste selber?", oder Übrigens-Zeile | Einziger Ort für WIAI-Verweis (optional, gedimmt, beiläufig) |

**Nicht alle Posts brauchen 3 Slides.** Aphorismen: 1 Slide. Stress-Bilder: 0 Text. Variation ist Teil der Variable Reward Schedule.

## Footer / Branding

| Element | Regel |
|---------|-------|
| `@herdom.bamberg` | SpaceMono 400, 28px, `rgba(255,255,255,0.25)`, unten zentriert |
| Position | 180px vom unteren Rand (über TikTok-UI-Bar) |
| Sichtbarkeit | Immer sichtbar, extrem dezent |
| Billboard S1/S2 | Kein Footer |
| Billboard S3 | Footer sichtbar |
| Akzentlinie | Optional, nur S3 wenn kein Button/Übrigens: 2px, 120px, WIAI_YELLOW, zentriert |

## Slide-3-Logik

| S3-Variante | Wann |
|-------------|------|
| Mic Drop / Punch | Standard -- der Post endet mit einem Knall |
| "Merkste selber, oder?" | Merkste-selber-Format |
| "Ich habe Fragen." | Kafka-Loop-Absurditäten |
| Übrigens-Zeile + Short-URL | Max. 1 von 10 Posts, gedimmt, beiläufig |
| Stille (nur Footer) | Aphorismen, nachdenkliche Posts |

## Grid-Wirkung auf TikTok-Profil

```
+-----------+-----------+-----------+
|  LED-Grid |           |  $>_      |
|  Contrarian  Merkste    Terminal  |
|  (farbig)   (schwarz)  (grün)    |
+-----------+-----------+-----------+
```

Die drei Designs erzeugen sofort unterscheidbare Thumbnails. LED-Wall dominiert, Billboard und Terminal brechen das Muster.
