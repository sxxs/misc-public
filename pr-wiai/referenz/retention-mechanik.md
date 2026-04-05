# Retention-Mechanik: Short-Form Video

Wie wir Zuschauer im Video halten. Alles hier ist aus der Produktion der ersten Posts entstanden — keine Theorie, sondern beobachtete Probleme und getestete Loesungen.

## Das Kernproblem

Short-Form-Viewer entscheiden in den ersten 1-2 Sekunden. Aber selbst wer bleibt, swiped bei **jeder Transition** weg, die nach "Video vorbei" aussieht. Der gefaehrlichste Moment ist nicht der Anfang — es ist der **Uebergang zwischen Acts**.

## 1. Kill Zone: Act-Transitions

### Problem
Wenn zwischen zwei Acts der Screen kurz schwarz wird (Fade-Out + Fade-In), interpretiert das Gehirn: "Fertig, weiter." Bei Billboard-Posts war das besonders schlimm — reines Schwarz ohne LED-Hintergrund.

Gemessene Dead Zone bei Fade-Transitions:
- Act1 Fade-Out: 8 Frames (0.27s)
- Act2 Fade-In: 20 Frames (0.67s)
- Total: ~0.6s fast-schwarzer Screen = Swipe-Impuls

### Loesung: Scroll-Transition (Billboard)
Mechanisches Billboard-Prinzip: alter Text schiebt nach oben raus, neuer kommt von unten rein. Kein schwarzer Moment, durchgehende Bewegung.

- Sequences ueberlappen um `SCROLL_FRAMES` (12f = 0.4s)
- `easeInOutQuad` fuer mechanisches Anfahr-/Brems-Gefuehl
- Panels beruehren sich lueckenlos: `|Act1.y| + Act2.y = 1920` in jedem Frame

LedWall hat dieses Problem nicht (LED-Raster als visuelles Bindeglied).

## 2. "Video haengt"-Reflex

### Problem
Statische Screens ohne jegliche Subpixel-Bewegung loesen den "haengt"-Reflex aus. Viewer denken, das Video ist eingefroren, und swipen.

### Loesung: Snap Nudges
Diskrete Rucks an Content-Events statt durchgehendem Drift. Durchgehender Drift sieht nach Render-Bug aus. Gezielte Rucks sehen nach Absicht aus.

`snapNudge(frame, start, dur, px)` — ease-out-quadratic, wie eine Tafel die einrastet:
- **Act1**: Nudge bei Setup-Einblendung (-8px), Reveal (-10px), Pre-Exit-Tease (-6px)
- **Act2 Beats**: Jeder Beat bekommt einen Nudge 3 Frames nach Erscheinen (-6px)
- **Pre-Exit-Tease**: ~18 Frames vor Scroll — deutet das Wegziehen an, ohne auszufuehren

Wichtig: Die Rucks muessen **nach** dem Fade-In eines Elements kommen (3f Verzoegerung), damit man sieht WAS sich bewegt.

## 3. Act2-Engagement: Beat-System

### Problem
Wenn der Gag in Act2 zuendet, ist die Neugier befriedigt. Kein Grund fuer Act3.

### Loesung: Beats + Heckle
Billboard Act2 unterstuetzt ein `beats`-Array mit explizitem Timing, Groesse und Stil pro Element:

```json
"beats": [
  { "text": "1. Zukunft.", "at": 0 },
  { "text": "2. Malerische Stadt.", "at": 25 },
  { "text": "3. Der Gag.", "at": 55 },
  { "text": "– Ja, und?", "at": 80, "style": "heckle" }
]
```

Der **Heckle** (Akzentfarbe, Monospace, kleiner) ist der Forward Hook: eine Provokation am Ende von Act2, die den Viewer in Act3 zieht. "Ja, und?" stellt die Frage, Act3 beantwortet sie.

Styles: `default` (weiss, gross, bold), `dim` (70% weiss, kleiner), `heckle` (Akzentfarbe, Monospace).

Fallback: Ohne `beats` greift die alte `\n\n`-Splitting-Logik.

## 4. Act3: Visuelle Lebendigkeit

### Problem
Act3 steht lange im Bild (Punchline + Aside + Footer). Ohne Bewegung wirkt es tot.

### Loesungen
- **Breathing Glow**: Sinus-Puls auf dem gelben Schatten der Punchline. `0.18 + sin(frame * 0.1) * 0.10` — sichtbar aber nicht ablenkend.
- **Upward Drift**: -12px ueber die gesamte Act3-Dauer (durchgehend, nicht diskret — Act3 hat keine Content-Events fuer Nudges).
- **Aside + Footer gleichzeitig**: Spart Zeit. Footer-marginTop reduziert sich wenn Aside vorhanden.

## 5. Timing-Prinzipien

### Gesamtlaenge
9-10 Sekunden ist das Ziel. Laenger = mehr Absprung. Kuerzer = zu wenig Aufbau.

### Act-Proportionen (Billboard, getestet)
| Act | Frames | Sekunden | Anteil |
|-----|--------|----------|--------|
| Act1 | 60 | 2.0s | 21% |
| Act2 | 115 | 3.8s | 40% |
| Act3 | 110 | 3.7s | 39% |

Act1 so kurz wie moeglich — gerade genug fuer Hook + Reveal. Act2 traegt den Content. Act3 braucht genug Zeit fuer Punchline + Aside, aber nicht mehr.

### Safe Zones
BillboardFrame Top-Padding: 200px (statt 0). Ohne Padding ragt Content bei langen Act2-Beats in die YouTube-Titel-Zone.

## Checkliste: Neuer Billboard-Post

1. Ist Act1 unter 3 Sekunden?
2. Hat Act2 einen Forward Hook (Heckle oder aehnlich) der in Act3 zieht?
3. Ist Act3 mehr als nur Kommentar — adressiert er den Viewer direkt?
4. Gibt es in jedem Act mindestens ein Bewegungselement (Nudge, Scroll, Glow)?
5. Gibt es keinen Moment wo der Screen laenger als 0.3s "tot" ist?
