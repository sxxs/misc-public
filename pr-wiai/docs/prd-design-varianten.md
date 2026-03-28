# PRD: Design-Varianten für @herdom.bamberg

## Zusammenfassung

Drei visuelle Designs für die vorproduzierten Posts, die auf dem TikTok-Grid und in Videos/Carousels sofort unterscheidbar sind, aber innerhalb des schwarz-dominanten Farbschemas bleiben.

| Design | Visueller Kern | Grid-Signal | Einsatz |
|--------|---------------|-------------|---------|
| **Pixel Wall** | LED-Grid mit Retro-Sprite-Patterns | Erkennbares Muster in Gelb/Farbe | Contrarian, Ertappt, Gaming, WusstestDu |
| **Terminal** | Monospace-Text, blinkender Cursor | Grün oder Amber auf Schwarz | Nachtgedanke, Social Engineering, Selbstzerstörung |
| **Billboard** | Nur großer Text, maximaler Negativraum | Fast nur Schwarz mit weißem Text | Merkste selber, Unpopular Opinion |

Plus: **Newsjacking** (Screenshot + Halftone, bereits implementiert) und **App-native Duette/Stitches** als 4. und 5. visuelles Signal.

---

## 1. Pixel Wall (Erweiterung LedWall)

### Konzept

Die bestehende LED Wall (24×48 Grid, 1.152 LEDs) zeigt statt zufälliger Blink-Muster erkennbare Pixel-Art-Sprites und geometrische Muster. Die Sprites sind im s1-Modus gedimmt sichtbar, in s3 leuchten sie auf. Alle bestehenden Effekte (Glitch, Overdrive, Mic-Drop-Flash, Staggered Enter/Exit) bleiben erhalten.

### Technische Umsetzung

**Neuer Prop auf `LedWall`:**

```tsx
interface Props {
  // ... bestehende Props ...
  pattern?: LedPattern;  // optional: wenn gesetzt, ersetzt hash-basierte Logik
}

interface LedPattern {
  type: "static" | "animated";
  // 24×48 Grid: true = Sprite-LED (accent color), false = Hintergrund-LED (wie bisher)
  frames: boolean[][][];  // animated: Array von Frames; static: Array mit einem Frame
  fps?: number;           // animated: Pattern-Framerate (default: 4 — retro-langsam)
  invert?: boolean;       // invertiert das Muster (z.B. für Blink-Effekt)
}
```

**Rendering-Logik:**

Wenn `pattern` gesetzt ist, bestimmt das Pattern-Array ob eine LED zum Sprite gehört oder zum Hintergrund:

```
Sprite-LED:
  s1: opacity 0.45 (sichtbar, aber gedimmt)
  s2: opacity 0.06 (kaum sichtbar, wie bisher minimal)
  s3: opacity 0.92 (hell, leuchtet auf)

Hintergrund-LED:
  Wie bisher (hash-basiert, s1/s2/s3 Logik unverändert)
```

Das Pattern wird als JSON-Datei geladen, nicht inline. Tooling (separates Script) kann PNGs in Pattern-Arrays konvertieren.

**Invertierung / Blink-Effekt:**

`invert: true` tauscht Sprite/Hintergrund-Zuordnung. Im Video kann das Pattern alle N Sekunden kurz invertiert werden (z.B. 4 Frames invertiert, 120 Frames normal) — das erzeugt einen "Negativ-Blitz" der auf dem Grid auffällt.

### Verfügbare Pattern-Bibliothek

Alle Patterns passen in das 24×48 Grid. Sprite-Größen orientieren sich an klassischer 8-Bit-Pixel-Art (8×8 bis 16×16 Pixel pro Sprite).

**Retro-Gaming:**

| Pattern | Größe | Beschreibung | Animation |
|---------|-------|-------------|-----------|
| `pacman` | 13×13 + Dots | Pac-Man mit Dot-Reihe | Mund öffnet/schließt (2 Frames), bewegt sich horizontal |
| `space-invader` | 11×8 | Klassischer Space-Invader-Sprite | Arme hoch/runter (2 Frames), sinkt langsam ab |
| `snake` | variabel | Snake-Schlange | Bewegt sich über das Grid (Pfad als Frame-Array) |
| `tetris-fall` | 4×2 bis 4×4 | Tetris-Piece fällt | Fällt von oben nach unten, bleibt liegen |
| `pong` | 1×6 + 2×2 | Zwei Paddles + Ball | Ball bounced zwischen Paddles |

**Geometrisch / Abstrakt:**

| Pattern | Beschreibung | Animation |
|---------|-------------|-----------|
| `maze` | Labyrinth-Muster (statisch) | Kein — rein dekorativ |
| `binary-rain` | Matrix-artiger vertikaler Regen | Spalten "fallen" mit unterschiedlichem Timing |
| `heartbeat` | Herz oder Pulslinie | Pulsiert (3-4 Frames) |
| `chevrons` | Pfeil-Muster nach oben | Scrollt langsam nach oben |
| `grid-wave` | Sinus-Welle über das Grid | Welle bewegt sich horizontal |
| `random-walk` | Punkt bewegt sich zufällig | Brownsche Bewegung |
| `conway` | Game of Life | Echte GoL-Simulation als Pattern |

**Thematisch:**

| Pattern | Einsatz | Beschreibung |
|---------|---------|-------------|
| `lock` | IT-Sicherheit / Datenschutz | Vorhängeschloss-Sprite |
| `eye` | Überwachung / Tracking | Auge, blinzelt gelegentlich |
| `wifi` | WLAN / Netzwerk | WiFi-Symbol, Wellen pulsieren |
| `cursor-arrow` | Meta / Manipulation | Maus-Cursor |
| `qmark` | Merkste selber | Fragezeichen |

### Farbwahl

Pixel Wall verwendet immer die `accentColor` des Posts (default: `WIAI_YELLOW #FACC15`). Die Sprites sind monochromatisch — eine Farbe, verschiedene Opacities.

Für thematische Variation kann `accentColor` pro Post gewählt werden:

| Thema | Farbe | Hex | Wann |
|-------|-------|-----|------|
| Standard | WIAI-Gelb | `#FACC15` | Default für alles |
| Alarm / Ertappt | WIAI-Rot | `#EF4444` | Fake-Statistik, Manipulation |
| Tech / KI | WIAI-Blau | `#3B82F6` | KI-Themen, Zukunft |
| Neutral | WIAI-Weiß | `#F0EDE8` | Ruhige Posts, Nachtgedanken |

### Post-Zuordnung Pixel Wall

| Posts | Pattern | Begründung |
|-------|---------|-----------|
| 48 (Matchmaking), 49 (Lootboxen) | `pacman` oder `space-invader` | Gaming-Thema, Retro-Referenz |
| 50 (Anti-Cheat) | `space-invader` | Hacker vs. System |
| 51-53 (Social Engineering) | `lock` oder `eye` | IT-Sicherheit |
| 35-40 (Ertappt) | `eye` oder `cursor-arrow` | Überwachung / "ich sehe dich" |
| 45 (Privatsphäre) | `lock` | Datenschutz |
| 47 (Plattform-Mechaniken) | `cursor-arrow` | Meta / Manipulation |
| 22 (Tensor Tournament) | `tetris-fall` | ML-Hackathon / Wettbewerb |
| 21 (KI abschalten) | `binary-rain` | Matrix-Vibe / KI-Thema |
| 29 (Binary Search) | `maze` | Suche / Algorithmus |
| 32 (IKEA / Frustrationstoleranz) | `snake` | Spielerische Analogie |
| Default (kein spezifisches Thema) | `random` (Bestand) | Wie bisher, keine Patterns |

---

## 2. Terminal (Neue Composition)

### Konzept

Kein LED Wall. Schwarzer Hintergrund, Monospace-Schrift, blinkender Block-Cursor. Text erscheint zeichenweise. Die Ästhetik sagt: "Jemand tippt das um 2 Uhr nachts in ein Terminal."

### Visuelles Design

**Hintergrund:**
- Solides Schwarz (`#0A0A0A`)
- Dezente Scanlines (bestehender `scanlineGradient`, Opacity 0.06 — subtiler als normal)
- Kein Halftone, keine Corner-Clusters, kein SlideFrame

**Schrift:**
- `SpaceMono 400` (bereits geladen) für allen Text
- Schriftgröße: 56px für Haupttext, 42px für Subtext/Button
- Zeilenhöhe: 1.6 (großzügig, wie ein echtes Terminal)

**Cursor:**
- Block-Cursor: `█` (U+2588)
- Blink-Timing: 530ms on / 530ms off (Standard-Terminal)
- Farbe: identisch zur Textfarbe
- Erscheint am Ende der aktuell getippten Zeile
- Bleibt am Ende des Texts stehen und blinkt weiter

**Text-Erscheinung:**
- Zeichenweise, nicht zeilenweise
- Geschwindigkeit: 2 Frames pro Zeichen (= 15 Zeichen/Sekunde, natürliches Tipp-Tempo)
- Leichte Variation: gelegentlich 3 Frames (1 von 8 Zeichen) — simuliert menschliches Tippen
- Keine Tipp-Sounds (Sound kommt aus der Musik oder wird in der App gewählt)

### Farbmodi

Terminal-Posts wählen eine von drei Farbpaletten über den `terminalColor`-Prop:

| Modus | Textfarbe | Cursor | Hex | Einsatz |
|-------|-----------|--------|-----|---------|
| **Green** | Terminal-Grün | Terminal-Grün | `#33FF33` | Social Engineering, Hacker-Themen |
| **Amber** | Terminal-Amber | Terminal-Amber | `#FFB000` | Nachtgedanken, Warnungen |
| **White** | Weiß | Weiß | `#FFFFFF` | Neutral / allgemein |

Optional: Dezenter Glow hinter dem Text in der jeweiligen Farbe (`text-shadow: 0 0 20px <farbe> at 0.15 opacity`). Nicht übertreiben — das ist kein Sci-Fi-Film.

### Neue Farb-Konstanten

In `colors.ts`:

```ts
export const TERMINAL_GREEN = "#33FF33";
export const TERMINAL_AMBER = "#FFB000";
```

### Act-Struktur

**Act1 — Prompt:**
- Zeigt einen "Terminal-Prompt" als Kontext
- Nachtgedanke: Die Uhrzeit als Prompt (`$ 23:31_`)
- Social Engineering: Ein Kommando (`$ whois target_`)
- Allgemein: Nur der blinkende Cursor, 2-3 Sekunden Stille
- Dauer: 60-90 Frames (2-3 Sekunden)

**Act2 — Typing:**
- Text erscheint zeichenweise mit Cursor
- Kein Cutout, kein Hintergrund-Element — nur Text auf Schwarz
- Dauer: Dynamisch, basierend auf Textlänge (2 Frames/Zeichen + 90 Frames Lesepuffer)

**Act3 — Punchline:**
- Text erscheint sofort (kein Tippen) — visueller Bruch zum Typing
- Oder: Text tippt schneller (1 Frame/Zeichen) — Urgency
- Kein LED-Wall-Overdrive, stattdessen: Cursor blinkt am Ende, dann stoppt und bleibt an (=fertig getippt)
- Button/Übrigens in kleinerer Schrift, gleiche Farbe bei 0.5 Opacity
- Kein Mic-Drop-Flash — das Terminal-Design ist leise

**Musik:**
- Keine vorproduzierte Musik — Terminal-Posts sind für TikTok Photo Mode (Musik in-App) oder mit minimalem Ambient
- Optional: Leises, monotones Hintergrundbrummen (50Hz-Hum, wie ein alter CRT-Monitor) — muss erst produziert werden, ist nice-to-have

### JSON-Schema-Erweiterung

```ts
// In types.ts:
export type PostType =
  | "newsjacking" | "nachtgedanke" | "wusstest-du"
  | "contrarian"  | "selbstironie"  | "witz"
  | "terminal"    | "billboard";     // NEU

export interface Post {
  // ... bestehende Felder ...
  terminalColor?: "green" | "amber" | "white";  // nur für type: "terminal"
  slide1: {
    // ... bestehende Felder ...
    prompt?: string;   // Terminal-Prompt (z.B. "$ 23:31")
  };
}
```

### Post-Zuordnung Terminal

| Posts | Farbe | Begründung |
|-------|-------|-----------|
| 6A-G (Informatik-Angst / Nachtgedanken) | Amber | Warm, spät, nachdenklich |
| 56A-B (Nachtgedanke Karriere) | Amber | "23:31" / "02:47" — Nacht-Setting |
| 51A-C (Handy-Hack) | Green | Hacker-Ästhetik |
| 52A-C (Phishing) | Green | IT-Sicherheit |
| 53A-B (Social Engineering) | Green | Kevin Mitnick, Hacker-Legende |
| 2A-H (Claude vs. Vorlesung) | White | KI/Neutral, "Computer spricht" |
| 37D-E (KI-generierter Quatsch) | White | "Wurde von ChatGPT geschrieben" |

---

## 3. Billboard (Neue Composition)

### Konzept

Nichts außer Text. Maximaler Negativraum. Die visuell ruhigste Variante — ein Plakat, kein Video. Funktioniert besonders gut für Posts die nur aus 2-3 kurzen Sätzen bestehen.

### Visuelles Design

**Hintergrund:**
- Solides Schwarz (`#0A0A0A`)
- Kein Halftone, keine Scanlines, keine Textur
- Kein LED Wall
- Kein SlideFrame (keine Corner-Clusters)

**Schrift:**
- `SpaceGrotesk 700` für Haupttext
- Schriftgröße: 96-120px (größer als bei allen anderen Designs — der Text IST das Design)
- Farbe: Weiß (`#FFFFFF`)
- Zentriert (horizontal und vertikal)
- Maximal 3 Zeilen pro Slide

**Gelber Glow (dezent):**
- `text-shadow: 0 0 60px rgba(250, 204, 21, 0.12)` — WIAI-Gelb als subtiler Schein hinter dem Text
- Nicht auf jedem Slide: nur auf S3 (Punchline), damit der Glow den Punch visuell verstärkt
- S1 und S2: kein Glow, reines Weiß auf Schwarz

**Footer:**
- `@herdom.bamberg` in SpaceMono 400, 28px, `rgba(255,255,255,0.25)`
- Unten zentriert, 180px vom unteren Rand (über TikTok-UI-Bar)
- Immer sichtbar, extrem dezent

**Akzentlinie (optional):**
- Dünne horizontale Linie in WIAI-Gelb (`#FACC15`), 2px Höhe, 120px Breite
- Zentriert, zwischen Haupttext und Footer
- Nur auf S3, nur wenn es keinen Button/Übrigens gibt

### Act-Struktur (Video)

**Act1 — Hook:**
- Text faded ein (0→1 über 20 Frames, ease-out)
- Steht 3-4 Sekunden
- Faded aus (1→0 über 8 Frames)
- Dauer: 120-150 Frames

**Act2 — Argument:**
- Identisch zu Act1: Fade in, stehen, Fade out
- Dauer: Dynamisch nach Textlänge

**Act3 — Punch:**
- Text faded ein, Gelb-Glow faded ein (leicht verzögert, +10 Frames)
- Button/Übrigens erscheint nach 60 Frames in kleinerer Schrift
- Kein dramatisches Ende — letzter Frame steht 2 Sekunden, dann Schnitt
- Dauer: 150-180 Frames

**Musik:**
- Keine — Billboard-Posts leben von der Stille (im Video) oder App-gewählter Musik (Photo Mode)
- Alternative: Einzelner tiefer Ton (Drone/Pad) der über das ganze Video liegt, kaum hörbar

### Act-Struktur (Carousel / Photo Mode)

Billboard ist das stärkste Format für TikTok Photo Mode Carousels:
- 3 PNGs, jedes ist ein Slide
- Schwarze Fläche, zentrierter Text, sonst nichts
- S3 hat den Gelb-Glow
- Kein Footer auf S1/S2, Footer nur auf S3

### JSON-Schema

Kein neues Feld nötig. `type: "billboard"` reicht:

```json
{
  "id": "billboard-vorhange",
  "type": "billboard",
  "slide1": { "bigText": "'Ich hab nichts zu verbergen.'" },
  "slide2": { "text": "Du hast Vorhänge an deinen Fenstern." },
  "slide3": { "text": "Merkste selber, oder?" }
}
```

`accentColor` bleibt immer `WIAI_YELLOW` — Billboard verwendet Gelb ausschließlich als Glow, nie als Textfarbe.

### Post-Zuordnung Billboard

| Posts | Begründung |
|-------|-----------|
| 45H (Nichts zu verbergen / Vorhänge) | Perfektes Billboard — 3 kurze Sätze |
| 47B (TikTok zeigt dir dieses Video) | Minimal, meta |
| 47C (0 Mal bewusst entschieden) | Zwei Zeilen, fertig |
| 41H (KI-Tools bauen vs. benutzen) | Zwei Perspektiven, Punch |
| 46A (Eltern 40 Jahre / Top-10-Jobs) | Zwei Fakten, Kontrast |
| 16E (Programmierik) | Unpopular Opinion, Wortspiel — braucht Platz |
| 28D (Informatik + Bier = Bamberg) | 2 Slides, maximale Lakonik |
| 58A (Du weißt nicht was du studieren sollst) | Kurz, direkt, kein Schnickschnack |
| 58C (Du wartest auf ein Zeichen) | Meta, funktioniert plakatmäßig |
| 59B (Abi 2,7 / NC) | Drei Zahlen, ein Punch |

---

## 4. Implementierungsreihenfolge

### Phase 1: Billboard (einfachste Composition)

1. `Billboard.tsx` — Neue Composition, ~80 Zeilen
   - Kein LED Wall, kein SlideFrame
   - Fade-in/out pro Act
   - Gelber Glow auf S3
   - Footer
2. `types.ts` — `"billboard"` zu `PostType` hinzufügen
3. `Root.tsx` — Billboard-Compositions registrieren
4. 2-3 Test-Posts als JSON
5. PNG-Export für Carousel testen

### Phase 2: Terminal (~120 Zeilen)

1. `TerminalText.tsx` — Neue Komponente für zeichenweises Typing + Cursor
   - Props: `text`, `charsPerFrame`, `cursorColor`, `startFrame`
   - Block-Cursor blinkt mit 530ms Intervall
   - Variation: gelegentlich 3 statt 2 Frames pro Zeichen
2. `Terminal.tsx` — Neue Composition
   - Act1: Prompt + blinkender Cursor
   - Act2: TerminalText
   - Act3: Punchline (sofort oder schnelles Tippen)
3. `colors.ts` — `TERMINAL_GREEN`, `TERMINAL_AMBER` hinzufügen
4. `types.ts` — `"terminal"` zu PostType, `terminalColor` und `prompt` zu Schema
5. Test-Posts: 1× Green (Hacker), 1× Amber (Nachtgedanke), 1× White

### Phase 3: Pixel Wall Patterns (~200 Zeilen + Tooling)

1. `LedWall.tsx` erweitern — `pattern` Prop
   - Wenn Pattern gesetzt: Sprite-LEDs vs. Background-LEDs unterscheiden
   - Animated Patterns: Frame-Index basierend auf `pattern.fps`
   - `invert` Support
2. Pattern-Dateien: `src/patterns/*.ts`
   - Jedes Pattern exportiert ein `LedPattern`-Objekt
   - Start mit 4-5 Patterns: `pacman`, `space-invader`, `lock`, `maze`, `binary-rain`
3. `png-to-pattern.ts` — CLI-Script
   - Input: 24×48 PNG (schwarz/weiß)
   - Output: `boolean[][]` als TypeScript
   - Für schnelles Erstellen neuer Patterns
4. JSON-Schema: `pattern` Feld zum Post hinzufügen
5. Test-Posts mit verschiedenen Patterns

### Phase 4: Pattern-Bibliothek erweitern (fortlaufend)

- Neue Patterns nach Bedarf
- Animierte Patterns (Pac-Man, Snake, Conway)
- Saisonale Patterns (z.B. Schneeflocken für Winter-Posts)

---

## 5. Farbkonzept — Gesamtübersicht

### Regel: Jeder Post hat genau eine Akzentfarbe

```
Schwarz (#0A0A0A)     — immer der Hintergrund
Weiß (#FFFFFF)         — immer die Textfarbe
Akzentfarbe            — variiert nach Design und Thema
```

### Akzentfarben pro Design

| Design | Akzentfarbe | Wie sie eingesetzt wird |
|--------|------------|----------------------|
| **Pixel Wall** | WIAI-Gelb (default), Rot, Blau, Weiß | LED-Farbe, Glitch-Tint, Glow |
| **Terminal** | Green, Amber, oder Weiß | Text + Cursor + Glow |
| **Billboard** | WIAI-Gelb (immer) | Nur als Glow auf S3, nie als Textfarbe |
| **Newsjacking** | WIAI-Gelb (default) | Halftone-Dots, Corner-Clusters |

### Neue Farb-Konstanten

```ts
// Bestehend:
WIAI_YELLOW  = "#FACC15"  // LED Wall default, Billboard Glow
WIAI_RED     = "#EF4444"  // Alarm, Ertappt
WIAI_BLUE    = "#3B82F6"  // Tech, KI
WIAI_WHITE   = "#F0EDE8"  // Ruhig

// Neu:
TERMINAL_GREEN = "#33FF33"  // Terminal: Hacker, IT-Sicherheit
TERMINAL_AMBER = "#FFB000"  // Terminal: Nachtgedanken, Warnungen
```

### Grid-Wirkung auf TikTok

Das TikTok-Profil-Grid zeigt Thumbnails. Die Designs erzeugen unterscheidbare Thumbnails:

```
┌─────────┬─────────┬─────────┐
│ ░░░░░░░ │         │ ▓▓░░░░░ │
│ ░PACMAN░│  Merkste │ $>_     │
│ ░░░░░░░ │  selber  │ whois   │
│ LED WALL│ BILLBRD  │TERMINAL │
└─────────┴─────────┴─────────┘
```

- **Pixel Wall:** Erkennbares farbiges Muster auf dunklem Grund
- **Billboard:** Fast nur Schwarz mit wenigen weißen Worten
- **Terminal:** Grüner oder amberfarbener Text, sofort erkennbar

---

## 6. Offene Fragen

1. **CRT-Hum für Terminal:** Lohnt sich ein 50Hz-Brummen als Audio-Layer, oder ist das overengineered? Kann auch nachträglich als In-App-Sound hinzugefügt werden.

2. **Carousel-Rendering Billboard:** Soll der PNG-Export für Carousels den Gelb-Glow auf S3 beibehalten, oder ist das nur für Video? (Empfehlung: beibehalten, sieht auch als PNG gut aus.)

3. **Pattern-Editor:** Lohnt sich ein visueller Editor (24×48 Grid im Browser anklicken) oder reicht das PNG-zu-Pattern-Script? (Empfehlung: Script reicht, Editor ist nice-to-have.)

4. **Maximale Pattern-Bibliothek:** Wie viele verschiedene Patterns sind realistisch für die ersten 30 Posts? (Empfehlung: 5-6 reichen für den Start, danach nach Bedarf.)
