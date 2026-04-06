# PRD: Nachtgedanke Phone-Format

## Zusammenfassung

Neues Visual Design fuer Nachtgedanke-Posts: Ein stilisiertes Smartphone-Display leuchtet warmweiss im stockdunklen Raum. Der Zuschauer sieht, was jemand um 02:47 auf dem Handy tippt. Das Visual IST die Story — jeder kennt die Situation, kein Erklaertext noetig.

## Motivation

- Nachtgedanke-Posts sind verletzlich, persoenlich, spaet-nachts
- Bisherige Loesungen (Terminal-Aesthetic, Billboard-Fade) passen nicht — zu technisch oder zu nah an anderen Formaten
- Das Smartphone im Dunkeln ist die universelle Nacht-Erfahrung der Zielgruppe (16-25)
- Differenziert sich visuell komplett von pixel-wall / billboard / terminal

## Visual Design

### Grundaufbau

```
┌─────────────────────────────┐
│                             │
│        ████████████         │  ← Stockdunkel, nur Phone leuchtet
│        █ 02:47  ⚡ █         │  ← Status-Bar: Zeit, WLAN, Akku
│  ●     █──────────█         │  ← Seitenbutton (Power/Volume)
│  ●     █          █         │
│        █  Text    █         │  ← Content-Bereich: dunkler Text
│        █  erschei █         │     auf warmweissem Display
│        █  nt hier █         │
│        █      |   █         │  ← Duenner Cursor (Strich, nicht Block)
│        █          █         │
│        █──────────█         │
│        ████████████         │
│                             │
│                             │
└─────────────────────────────┘
```

### Phone-Frame

- **Form**: Gerundetes Rechteck (borderRadius ~40px), leicht groesser als ein echtes Phone-Verhaeltnis (~390×780px im 1080×1920 Canvas)
- **Rahmen**: Subtiler dunkelgrauer Rand (2-3px), Seitenbuttons (Power rechts, Volume links) als kleine Rechtecke am Rand
- **Notch/Dynamic Island**: Stilisierte Pille oben mittig (optional — koennte auch weggelassen werden fuer Klarheit)
- **Positionierung**: Vertikal zentriert, horizontal zentriert, leicht nach oben verschoben (optische Mitte)

### Status-Bar

- **Schrift**: SF-Pro-aehnlich oder Space Grotesk, ~24px, dunkelgrau auf weiss
- **Inhalt links**: Uhrzeit aus `act1Setup` (z.B. "02:47")
- **Inhalt rechts**: WLAN-Icon (3 Boegen) + Akku-Icon (stilisiert, niedrig ~15%)
- **Funktion**: Verankert die Szene zeitlich, ohne extra Slide

### Display-Content

- **Hintergrund**: Warmweiss (#F5F0E8 oder aehnlich), NICHT reines Weiss — eher "Night Shift"-Ton
- **Schrift**: Space Grotesk, ~38-42px, Farbe #1A1A1A (fast schwarz)
- **Cursor**: Duenner vertikaler Strich `|` (2px breit, #1A1A1A), blinkt langsam (~1.5s Zyklus)
- **Typing**: Zeichen-fuer-Zeichen wie bei Terminal, aber in Smartphone-Aesthetic (keine Typos, kein CRT-Effekt)

### Glow-Effekt

Der Kern der visuellen Identitaet:

- **Display-Glow**: Das Phone-Display strahlt warmweisses Licht in die Dunkelheit. Umsetzung:
  - `box-shadow: 0 0 80px 20px rgba(245, 240, 232, 0.25)` auf dem Phone-Container
  - Zusaetzlich ein radialer Gradient hinter dem Phone der den "Lichtschein im dunklen Zimmer" simuliert
- **Text-Bleed**: Der schwarze Text auf dem hellen Display ist NICHT perfekt scharf. Der Glow vom Hintergrund "blutet" leicht in die Schrift:
  - `text-shadow: 0 0 6px rgba(245, 240, 232, 0.35)` auf dem Text
  - Erzeugt den Effekt, dass die Augen des Zuschauers (wie die der Person im Bett) nicht ganz fokussiert sind
- **Glow-Intensitaet**: Pulsiert langsam (Sinus, ~4s Zyklus), wie wenn das Display zwischen Inhalten leicht die Helligkeit anpasst

### Hintergrund (Dunkelheit)

- Reines Schwarz (#000000), KEIN Gradient, KEINE Vignette
- Das einzige Licht kommt vom Phone
- Optional: extrem subtile Textur (Korn/Noise bei 2-3% Opacity) um digitales Reinschwarz zu vermeiden

## Content-Struktur

### Variante A: Google-Suchhistorie (bevorzugt)

Der Phone-Screen zeigt Google-Suchanfragen die nacheinander erscheinen. Jede Zeile eskaliert. Kein expliziter Act-Wechsel — die Suchen sind der Content.

```
[Status-Bar: 02:47]

informatik berufschancen
informatik schwer
informatik abbrechen
informatik abbrechen bereut

[Punchline erscheint UNTER dem Phone oder ALS letzte Suche]
```

Mapping auf Acts:
- **Act1**: Phone fadet ein (Glow breitet sich aus), Status-Bar sichtbar, erster Suchbegriff tippt
- **Act2**: Weitere Suchbegriffe erscheinen, Eskalation
- **Act3**: Punchline — entweder als letzter Suchbegriff oder als Text ausserhalb des Phones

### Variante B: Notizen-App / Chatverlauf

Statt Google: eine Notizen-App oder ein Chatverlauf mit sich selbst. Offener fuer verschiedene Nachtgedanke-Inhalte.

### Content-Prinzipien

- **Kein Gestaendnis, sondern Beobachtung**: Nicht "Ich bin traurig" sondern etwas zeigen, das traurig-lustig IST
- **herdom-Filter**: Die Suchhistorie ist universell aber der Kommentar muss von jemandem kommen, der die Uni-Seite kennt
- **Eskalation**: Jede Zeile geht einen Schritt tiefer. Die Dramaturgie entsteht durch die Sequenz, nicht durch einzelne Saetze.

## Hook & Engagement Mechaniken

### Act1: Phone-Einblendung (Hook)

- **Einstieg**: Schwarzer Screen, dann beginnt der Glow — wie wenn jemand das Handy einschaltet
- **Phone fadet ein**: Glow breitet sich aus (0→full in ~20 Frames), Phone-Shape wird sichtbar
- **Status-Bar**: "02:47" erscheint — sofortige zeitliche Verankerung
- **Erster Suchbegriff beginnt zu tippen** — Curiosity Gap: "Was wird gesucht?"

### Act1→Act2: Kein harter Schnitt

Die Suchen erscheinen nacheinander auf dem gleichen Screen. Es gibt keinen sichtbaren Act-Wechsel. Die Transition ist rein inhaltlich (naechste Suche = naechster Eskalationsschritt). Das loest das Kill-Zone-Problem komplett — kein schwarzer Moment, keine Transition.

### Visual Interest waehrend Typing

- **Cursor-Blink**: Duenner Strich blinkt waehrend Pausen zwischen Suchen (~1.5s Zyklus)
- **Glow-Pulse**: Display-Helligkeit pulsiert minimal (~3% Amplitude)
- **Snap-Nudge**: Nach jeder fertigen Suchzeile ein subtiler Nudge des gesamten Phone-Frames nach oben (-4px, easeOut) — wie wenn der Viewer scrollt
- **Hard-Cut Zoom** (Schluesselmoment):
  - Bei einer bestimmten Suchanfrage (z.B. "informatik abbrechen") — ZOOM auf das Wort am Cursor
  - Schneller Scale von 1.0 auf ~2.5x in 3 Frames, zentriert auf das aktuelle Wort
  - Man sieht die weissen Pixel-Umrisse des Texts auf dem Display (Subpixel-Rendering wird sichtbar)
  - Hold fuer ~8 Frames
  - Zurueck auf 1.0x in 5 Frames (easeOut)
  - Gesamtdauer: ~16 Frames (0.5s)
  - Dieses Zoom-In ist der emotionale Beat — "das Wort, das man nicht tippen wollte"

### Act3: Punchline-Reveal

Optionen:
1. **Punchline ALS letzte Suche**: Erscheint im gleichen Suchfeld, aber in anderer Farbe (z.B. Akzentgelb statt Schwarz) — Google-Autovervollstaendigung-Look
2. **Punchline AUSSERHALB des Phones**: Text erscheint unter dem Phone im schwarzen Bereich (weiss auf schwarz, Space Grotesk) — klarer Bruch zwischen "was auf dem Handy steht" und "was der Kanal dazu sagt"
3. **Phone dreht/kippt weg**, Punchline erscheint dahinter — theatralisch, aber aufwaendiger

Empfehlung: Option 2 (Text unter Phone) — klare visuelle Trennung, einfacher zu implementieren, Punchline hat Platz.

### Aside / Footer

- Aside erscheint unter der Punchline (gedimmt, kleiner)
- Footer "WIAI · Uni Bamberg / echt.bamberg" ganz unten
- Beide innerhalb der Safe Zone

## Safe Zones

Kritisch fuer dieses Format weil das Phone-Element zentriert ist:

```
┌──────────────────────────────────┐
│  ░░░░░░░ TOP: 200px ░░░░░░░░░░  │  YouTube-Titel, TikTok-Username
│░░│                          │░░░░│
│░░│      Phone-Frame         │░░░░│  Phone muss komplett innerhalb
│░░│      (zentriert)         │░░░░│  der Safe Zone liegen
│░░│                          │░░░░│
│  │                          │    │
│  │  Punchline-Text          │    │
│  │  (links-buendig,         │    │
│  │   wie Billboard)         │    │
│  │                          │    │
│  ░░░░░░ BOTTOM: 400px ░░░░░░░░  │  TikTok-UI, Kommentare
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────┘
 ░░                            ░░░░
 LEFT: 108px              RIGHT: 180px
```

- **Phone-Frame**: Rechter Rand des Phones mindestens 180px vom rechten Screen-Rand (TikTok Share/Comment-Buttons)
- **Punchline-Text**: Wie Billboard — `padding: 200px 240px 400px 108px`
- **Status-Bar im Phone**: Interne Padding, nicht in der globalen Safe Zone

## Timing-Ziel

9-10 Sekunden gesamt:

| Phase | Frames | Sekunden | Inhalt |
|-------|--------|----------|--------|
| Phone-Einblendung | 30 | 1.0s | Glow baut sich auf, Status-Bar |
| Suche 1-2 | 70 | 2.3s | Typing + Pause |
| Suche 3 (+ Zoom) | 50 | 1.7s | Typing + Hard-Cut Zoom + Hold |
| Suche 4 | 40 | 1.3s | Letzte Eskalation |
| Punchline + Aside | 95 | 3.2s | Text erscheint unter Phone |
| **Total** | **285** | **9.5s** | |

## Technische Komponenten

### Neue Dateien

- `src/components/PhoneFrame.tsx` — Wiederverwendbare Phone-Shape mit Status-Bar, Glow, Content-Slot
- `src/compositions/Nachtgedanke.tsx` — Ueberarbeitete Composition die PhoneFrame nutzt

### Bestehende Dateien (Aenderungen)

- `src/types.ts` — Optionale `NachtgedankeConfig` (Suchbegriffe mit Timing, Zoom-Target)
- `src/utils/timing.ts` — Duration-Berechnung fuer Nachtgedanke
- `export-post.mjs` — Nachtgedanke-Export-Logik

### PhoneFrame Props (Entwurf)

```typescript
interface PhoneFrameProps {
  time: string;              // Status-Bar Uhrzeit ("02:47")
  batteryLevel?: number;     // Akku-Stand (default: 15)
  glowIntensity?: number;    // 0-1, pulsiert
  children: React.ReactNode; // Display-Content
}
```

### NachtgedankeConfig (Entwurf)

```typescript
interface NachtgedankeConfig {
  searches: NachtSearch[];     // Suchbegriffe mit Timing
  zoomAt?: number;             // Index des Suchbegriffs fuer Hard-Cut Zoom
  punchlineStyle?: "search" | "below"; // Wo Punchline erscheint
}

interface NachtSearch {
  text: string;
  at: number;                  // Frame wann Typing beginnt
  typingSpeed?: number;        // chars/frame (default: 0.6)
}
```

## Offene Fragen

1. **Notch/Dynamic Island**: Zeigen oder weglassen? Zeigen = realistischer, weglassen = cleaner
2. **Google-UI oder Notizen-UI?**: Google-Suchleiste ist sofort erkennbar aber limitiert den Content auf Suchanfragen. Notizen-App ist flexibler.
3. **Punchline-Position**: Unter dem Phone (klar getrennt) oder als letzte Suche (nahtlos)?
4. **Autovervollstaendigung**: Koennte man als visuelles Element nutzen — der vorgeschlagene Text erscheint grau BEVOR der User ihn tippt. "informatik abbre—" → Autocomplete zeigt "informatik abbrechen" in Grau.
5. **Content fuer den ersten Post**: Google-Suchhistorie (Berufschancen→abbrechen→bereut) oder anderer Nachtgedanke?
6. **Wiederverwendbarkeit**: Soll das Phone-Format auch fuer andere Content-Typen nutzbar sein (z.B. Chat-Nachrichten, Benachrichtigungen)?
