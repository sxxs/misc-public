# PRD: Neue Visual Designs für die Remotion-Pipeline

## Kontext

Aktuell hat die Pipeline 4 Designs: **Pixel Wall** (LED-Raster, 3 Slides), **Billboard** (schwarz, Fade-In), **Terminal** (Monospace-Typing), **Newsjacking** (Screenshot+Halftone). Alle folgen dem gleichen 3-Akt-Modell (Hook → Argument → Punchline).

Für den Variable Reward Schedule brauchen wir mehr **visuelle Abwechslung** — nicht nur im Inhalt, sondern auch in der Darstellungsform. Die neuen Designs sollen sich bewusst vom 3-Slide-Modell lösen und eigene Rhythmen haben.

## Design 1: Billboard v2 — Caption-Style Rapid Cuts

### Vision
Statt eines statischen Textes: **wenige Wörter gleichzeitig**, schnell geschaltet, wie Untertitel-Karaoke oder Lyric-Videos. Am Ende wegblitzen.

### Visuelles Konzept
- **Schwarzer Hintergrund** (wie bisher)
- Text erscheint in kurzen Phrasen (2–5 Wörter), jede Phrase ~20–30 Frames (0.7–1s)
- **Zwei Textstile** im Wechsel:
  - **Invertiert**: Weißer Text auf Schwarz (Standard)
  - **Ausgeschnitten**: Schwarzer Text auf weißer Bounding-Box (Zeitungs-Ausschnitt-Look, `DirtyCutout`-Stil)
- Wechsel zwischen beiden Stilen erzeugt visuellen Rhythmus
- **Punchline**: Letzte Phrase bleibt 1–2s stehen, dann **Flash-Out** (weißer Blitz → schwarz)
- Kein Fade-In/Out — harte Cuts

### Datenmodell (JSON)
```json
{
  "type": "billboard",
  "billboard": {
    "mode": "captions",
    "captions": [
      { "text": "Dein Handy weiß", "style": "white" },
      { "text": "wo du gestern warst", "style": "cutout" },
      { "text": "was du gegessen hast", "style": "white" },
      { "text": "und wie lange du geschlafen hast.", "style": "cutout" },
      { "text": "Dein bester Freund", "style": "white" },
      { "text": "weiß das nicht.", "style": "white", "hold": 45 }
    ]
  }
}
```

### Timing
- Default: 25 Frames pro Caption (~0.83s)
- `hold`-Override pro Caption möglich (für Punchline)
- Flash-Out: 6 Frames am Ende (weiß→schwarz)
- Gesamtdauer: `sum(caption.hold || 25) + 6`

### Abgrenzung zu Billboard v1
- v1 (`billboard.mode` nicht gesetzt oder `"classic"`): Bestehendes 3-Slide Fade-In-Verhalten bleibt erhalten
- v2 (`billboard.mode: "captions"`): Neues Caption-Verhalten
- Beide Modes nutzen dieselbe `Billboard.tsx` Composition mit Branch

### Implementierung
- `Billboard.tsx`: Neuer Branch wenn `post.billboard?.mode === "captions"`
- Neues Component: `CaptionSequence.tsx` — rendert Array von Captions sequenziell
- Nutzt `DirtyCutout`-Komponente für den Ausschnitt-Stil (existiert bereits)
- Duration-Berechnung: `computeBillboardCaptionDuration(captions)`
- Flash-Out: Weißes Fullscreen-Overlay, Opacity 1→0 über 6 Frames

---

## Design 2: Terminal v2 — Pausen-Modus

### Vision
Text erscheint nicht mehr als 3 getrennte Slides, sondern **ein durchgehender Textblock** mit eingebauten **Pausen** — wie eine Person die nachdenkt, bevor sie weitertippt. Ermöglicht dramatische Beats innerhalb eines einzigen Textflusses.

### Visuelles Konzept
- **CRT-Hintergrund** (wie bisher: Scanlines, subtiler Glow)
- Ein einziger `TerminalText`-Render über die gesamte Dauer
- Text tippt Zeichen für Zeichen (wie bisher)
- An markierten Stellen: **Pause** — Cursor blinkt, nichts passiert, Spannung baut sich auf
- Optionaler Stil-Wechsel mitten im Text: Farbe ändern (grün→amber→weiß) für emotionale Shifts
- Kein Act1/Act2/Act3-Split — ein einziger Flow

### Datenmodell (JSON)
```json
{
  "type": "terminal",
  "terminal": {
    "mode": "flow",
    "color": "green",
    "prompt": "herdom $",
    "blocks": [
      { "text": "Dein Handy wurde gehackt." },
      { "pause": 45 },
      { "text": "Kein Totenkopf auf dem Bildschirm.\nDein Handy funktioniert normal.", "color": "amber" },
      { "pause": 30 },
      { "text": "Nur dass jemand mitliest." },
      { "pause": 60 },
      { "text": "Das Gefährliche am Hack ist\ndass du ihn nicht merkst.", "color": "white" }
    ]
  }
}
```

### Timing
- Tipp-Geschwindigkeit: 0.5 chars/frame (wie bisher)
- Pause: Exakte Frame-Angabe, Cursor blinkt weiter
- Prompt-Phase: 50 Frames (Prompt erscheint, Cursor blinkt)
- Ende: 90 Frames Lesezeit nach letztem Zeichen
- Gesamtdauer: `50 + sum(block.text.length * 2 + block.pause || 0) + 90`

### Abgrenzung zu Terminal v1
- v1 (`terminal.mode` nicht gesetzt oder `"classic"`): Bestehendes 3-Act-Verhalten
- v2 (`terminal.mode: "flow"`): Neuer Flow-Modus mit Blocks und Pausen
- Cursor-Stil bleibt gleich (530ms Blink-Zyklus)

### Implementierung
- `Terminal.tsx`: Neuer Branch wenn `post.terminal?.mode === "flow"`
- Neues Component: `TerminalFlow.tsx` — verarbeitet Block-Array sequenziell
- Erweitert `TerminalText.tsx` um `colorChange`-Support (Glow-Farbe wechselt mid-typing)
- Duration-Berechnung: `computeTerminalFlowDuration(blocks)`

---

## Design 3: Raw Photo / Slideshow

### Vision
Komplett anders als alle Text-Designs: **Fotos oder Bilder**, schnell geschnitten, mit optionalem Text-Overlay. Zwei Varianten:

**Variante A: "Ertappt-Foto"** — Ein einzelnes Foto das einen "unangenehmen Moment den man von sich selbst kennt" zeigt. Minimaler Text, maximale visuelle Wirkung.

**Variante B: "Slideshow"** — Schnell geschnittene Bildfolge (5–12 Bilder, je 0.5–1.5s), z.B. hübsche Bamberg-Campus-Bilder oder eine Reihe von "Ertappt"-Momenten.

### Visuelles Konzept
- **Kein LED-Raster, kein Terminal** — Fotos als visuelles Hauptelement
- Bilder füllen das gesamte Canvas (1080×1920)
- Kein klassischer Ken-Burns (zu altbacken für TikTok/Reels). Stattdessen: **digitale Bildeffekte** die zur Pixel-Ästhetik des Kanals passen

### Bild-Effekte (pro Bild konfigurierbar)

**Pixelation-Reveal** (`effect: "depixelate"`):
Bild startet stark verpixelt (Blöcke 40px), wird über die Dauer schrittweise schärfer. Gut für Opener — "Was siehst du?" Spannung.

**Pixelation-Hide** (`effect: "pixelate"`):
Bild startet klar, wird verpixelt + geblurrt. Text-Overlay erscheint auf dem verpixelten Hintergrund. Gut für Punchlines — Bild wird unwichtig, Botschaft tritt hervor.

**Pixel-Streifen** (`effect: "pixel-strips"`):
Horizontale oder vertikale Streifen des Bildes sind verpixelt, wandern animiert über das Bild. Erzeugt einen "Scan"-Look. Kann mit Depixelation kombiniert werden (Streifen entpixeln sequenziell).

**Saturierung** (`effect: "desaturate"` / `"saturate"`):
Bild startet entsättigt (fast schwarzweiß), Farbe kommt langsam rein — oder umgekehrt. Kann mit Pixelation kombiniert werden. Entsättigtes Bild mit WIAI-Gelb als einzige Farbe = starker Marken-Effekt.

**Tönung** (`effect: "tint"`):
Bild monochromatisch in Akzentfarbe getönt (wie Duotone). Gut für Stimmungsbilder, passt zur schwarz-dominanten Ästhetik.

**Ganz langsamer Drift** (`effect: "drift"`):
Minimale Bewegung (1-2% Zoom über 4-5 Sekunden). Kein klassischer Ken-Burns-Effekt, sondern gerade genug Bewegung dass das Bild "lebt". Default für Bilder ohne anderen Effekt.

### Kombination: Bild + Botschaft

Typische Sequenzen:
1. **Reveal → Text**: Bild depixeliert (3s) → hält kurz (1s) → pixeliert + blurrt → Text auf verpixeltem BG (3s)
2. **Text → Reveal**: Text auf verpixeltem/getöntem BG (3s) → Bild entpixelt/entsättigt als Auflösung (3s)
3. **Slideshow**: 5-8 Bilder mit harten Cuts, je 1s, abwechselnd Effekte, letztes Bild hält + Text

### Harte Cuts zwischen Bildern (kein Fade)
### Abspann: Letztes Bild verpixelt + blurrt → @herdom.bamberg Wasserzeichen

### Datenmodell (JSON)

Variante B — Slideshow (mehrere Bilder, schnell geschnitten):
```json
{
  "type": "slideshow",
  "accentColor": "#FACC15",
  "slideshow": {
    "images": [
      { "src": "media/laptop-rows-empty.jpg", "duration": 40, "effect": "depixelate" },
      { "src": "media/erba-campus-water.jpg", "duration": 35, "effect": "tint" },
      { "src": "media/hackathon-midnight.jpg", "duration": 35, "effect": "drift" },
      { "src": "media/bierkeller-sommer.jpg", "duration": 35, "effect": "saturate" }
    ],
    "endCard": {
      "text": "@herdom.bamberg",
      "duration": 60,
      "effect": "pixelate"
    }
  }
}
```

Variante A — Einzel-Foto mit Reveal→Text-Sequenz:
```json
{
  "type": "slideshow",
  "slideshow": {
    "images": [
      { "src": "media/300-laptops-0630.jpg", "duration": 120, "effect": "depixelate" },
      { "src": "media/300-laptops-0630.jpg", "duration": 120, "effect": "pixelate",
        "text": "300 Laptops. 06:30. Keiner da." }
    ],
    "endCard": { "text": "@herdom.bamberg", "duration": 60 }
  }
}
```
(Gleiches Bild zweimal: erst Reveal, dann Pixelate mit Text-Overlay.)

### Effect-Typen

| Effect | Parameter | Beschreibung |
|--------|-----------|-------------|
| `depixelate` | — | Pixel-Blöcke 40px→1px über die Dauer |
| `pixelate` | — | 1px→40px + Gaussian Blur |
| `pixel-strips` | `direction: "h"\|"v"` | Animierte Pixel-Streifen wandern übers Bild |
| `desaturate` | — | Farbe→S/W |
| `saturate` | — | S/W→Farbe |
| `tint` | Nutzt `accentColor` | Monochromatische Tönung |
| `drift` | — | Default. Minimaler Zoom 1-2% (kein Ken Burns) |

Effekte sind kombinierbar: `"effect": ["desaturate", "depixelate"]` — startet entsättigt+verpixelt, wird farbig+scharf.

### Timing
- Pro Bild: `duration` in Frames (default 35 = ~1.2s)
- Effekt-Animation: Über die gesamte Bild-Dauer interpoliert
- End-Card: Letztes Bild pixeliert (20f) → Wasserzeichen auf verpixeltem BG (40f)
- Gesamtdauer: `sum(image.duration) + endCard.duration`

### Implementierung
- Neuer Type: `"slideshow"` in `PostType` Union
- Neue Composition: `Slideshow.tsx`
- Neues Component: `PhotoFrame.tsx` — lädt Bild via `staticFile()`, wendet Effect-Chain an
- Effekte als Remotion-`interpolate()`-Animationen auf CSS-Filter (pixelate via canvas, saturate/tint via CSS filter)
- Pixelation: Canvas-basiert (`drawImage` auf kleines Canvas → `imageSmoothingEnabled: false` → Scale-up) oder via `image-rendering: pixelated` + dynamischem Resize
- Bilder in `wiai-social/public/media/`
- Duration: `computeSlideshowDuration(images, endCard)`
- Musik: Optional. Ambient-Track als `<Audio>` mit `volume={0.3}`
- Render-Output: Video + N Stills (eins pro Bild = Carousel für Photo Mode)

---

## Design 4: Newsjacking v2 (optional, niedrige Priorität)

Aktuell existiert Newsjacking bereits. Mögliche Erweiterung: **Split-Screen** — Screenshot links, herdom-Kommentar rechts, mit Typing-Animation. Niedrige Priorität, da das bestehende Format funktioniert.

---

## Abhängigkeiten

### Gemeinsame Änderungen
- `src/types.ts`: Neue Interfaces (`BillboardCaptions`, `TerminalFlow`, `Slideshow`)
- `src/utils/timing.ts`: 3 neue Duration-Calculator
- `src/compositions/WiaiPost.tsx`: Neue Cases im Switch
- `src/Root.tsx`: Registration für neue Post-Typen

### Reihenfolge
1. **Billboard Captions** — Kleinstes Delta, nutzt existierende Komponenten (DirtyCutout). Viele Posts im 21-Tage-Plan sind Billboard.
2. **Terminal Flow** — Mittleres Delta, erweitert TerminalText. 4 Posts im 21-Tage-Plan sind Terminal.
3. **Slideshow** — Größtes Delta, komplett neuer Render-Pfad. Braucht echte Fotos.

### Nicht betroffen
- Pixel Wall / Contrarian: Bleibt wie es ist
- Musik-System: Unverändert
- LED-Pattern-System: Unverändert
- render.sh: Funktioniert automatisch mit neuen Types (Duration wird aus Code berechnet)
- Carousel-Crop: Funktioniert automatisch

## Entscheidungen

### 1. Billboard Captions — Schriftgröße
**Variable Größe nach Wortanzahl**, automatisch:
- 1–2 Wörter → 120px (maximal plakativ)
- 3–4 Wörter → 80px
- 5+ Wörter → 60px

Erzeugt typografischen Rhythmus: Punchlines (kurz) werden automatisch betont.

### 2. Terminal Flow — Prompt
**Prompt oben fixiert**, Text fließt darunter. Wenn Text die untere Safe Zone erreicht, scrollt ältester Text nach oben weg. Prompt bleibt immer sichtbar als visueller Anker.

### 3. Bilder-Speicherort
**`wiai-social/public/media/`** — Remotion braucht `staticFile()`, das liest aus `public/`. Post-JSON referenziert relativ: `"src": "media/dateiname.jpg"`.

### 4. Musik
- **Billboard Captions**: Stille mit optionalem Bass-Hit auf der Punchline. Die Stille zwischen Cuts IST der Rhythmus.
- **Terminal Flow**: Silent oder minimaler Ambient-Hum. Pausen wirken stärker in Stille.
- **Slideshow**: Optional Ambient-Track (`volume: 0.3`). Bei Ertappt-Foto: Stille. Bei Campus-Slideshow: emotionaler Loop.

### 5. Carousel-Output
- **Billboard Captions**: Jede Caption wird ein Carousel-Bild (N Stills statt 3). Passt perfekt zu TikTok/Instagram Photo Mode — jede Caption = ein Swipe.
- **Slideshow**: Jedes Bild wird ein Carousel-Bild.
- `render.sh` erkennt an der Composition-Dauer automatisch wie viele Stills es braucht. Oder: `stills`-Array im JSON spezifiziert die Frame-Nummern explizit.
